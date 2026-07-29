import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { createHash, randomInt } from "crypto";

import { UserRepository } from "../../data/repositories/user.repository";
import { AuthTokenRepository } from "../../data/repositories/authToken.repository";
import { EmailService } from "../services/email.service";

import { User, PerfilUsuario } from "../../data/entities/user.Entity";
import { IUsuarioLogado } from "../../data/interfaces/iUsuarioLogado.Interface";
import { CreateUserRequestDto } from "../../presentation/dto/request/users/createUserRequestDto";
import { UserResponseDto } from "../../presentation/dto/response/userResponse.dto";
import { LoginRequestDto } from "../../presentation/dto/request/loginRequestDto";
import { LoginResponseDto } from "../../presentation/dto/response/loginResponse.dto";

const AUTH_TOKEN_TYPE = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  RESET_PASSWORD: "RESET_PASSWORD",
} as const;

@Injectable()
export class UserApplication {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: AuthTokenRepository,
    private readonly emailService: EmailService
  ) {}

  // ==========================================
  // REGISTRO E VERIFICAÇÃO
  // ==========================================
  async create(data: CreateUserRequestDto): Promise<UserResponseDto> {
    if (data.perfil === "ADMIN") {
      throw new BadRequestException("Não é permitido criar uma conta de administrador por este canal.");
    }

    const emailExiste = await this.userRepository.findByEmail(data.email);
    if (emailExiste) throw new BadRequestException("Este email já está em uso.");

    const usuarioExiste = await this.userRepository.findByUsuario(data.usuario);
    if (usuarioExiste) throw new BadRequestException("Este nome de usuário já está em uso.");

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(data.senha, salt);

    const novoUser = new User({
      nome: data.nome,
      usuario: data.usuario,
      email: data.email,
      senha: senhaCriptografada,
      perfil: data.perfil as PerfilUsuario,
      active: false,
    });

    const userSalvo = await this.userRepository.save(novoUser);
    if (!userSalvo.id) {
      throw new InternalServerErrorException("Erro ao criar usuário.");
    }

    // Gera código OTP de 6 dígitos numéricos (igual ao forgotPassword)
    const codigo = randomInt(0, 1000000).toString().padStart(6, "0");
    const tokenHash = createHash('sha256').update(codigo).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3304").replace(/\/+$/, "");
    const verifyPageUrl = `${frontendUrl}/verificar-email`;

    await this.tokenRepository.create(userSalvo.id, tokenHash, AUTH_TOKEN_TYPE.VERIFY_EMAIL, expiresAt);

    await this.emailService.sendEmail(
      data.email,
      "Confirme seu e-mail — Apaixone-se",
      `Olá, ${data.nome}!\n\nSeu código de verificação é: ${codigo}\n\nAcesse ${verifyPageUrl} e insira o código acima para ativar sua conta.\n\nEste código expira em 24 horas.\n\nSe você não criou essa conta, ignore este e-mail.`,
      `<div style="font-family: Arial, Helvetica, sans-serif; background-color: #f5f7fb; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e6ebf2;">
          <h2 style="margin: 0 0 8px; color: #1f2937; font-size: 22px;">Confirme seu e-mail</h2>
          <p style="margin: 0 0 20px; color: #374151; line-height: 1.6;">
            Olá, <strong>${data.nome}</strong>! Use o código abaixo para ativar sua conta:
          </p>
          <div style="display: inline-block; margin: 0 0 24px; padding: 14px 24px; background: #eef2ff; color: #1d4ed8; border-radius: 10px; font-size: 36px; letter-spacing: 10px; font-weight: 700; font-family: monospace;">
            ${codigo}
          </div>
          <p style="margin: 0 0 8px; color: #374151; line-height: 1.6;">
            Acesse a página de verificação e insira o código acima:
          </p>
          <p style="margin: 0 0 20px;">
            <a href="${verifyPageUrl}" style="color: #1d4ed8; word-break: break-all;">${verifyPageUrl}</a>
          </p>
          <p style="margin: 0 0 8px; color: #374151; line-height: 1.6;">
            Este código expira em <strong>24 horas</strong>.
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Se você não criou essa conta, pode ignorar este e-mail com segurança.
          </p>
        </div>
      </div>`
    );

    return this.mapToResponseDto(userSalvo);
  }

  async verifyEmail(codigo: string) {
    const normalizedCodigo = (codigo || "").trim();
    if (!normalizedCodigo) {
      throw new BadRequestException("Código inválido ou ausente.");
    }

    // Valida que é numérico de 6 dígitos
    if (!/^\d{6}$/.test(normalizedCodigo)) {
      throw new BadRequestException("O código deve ter 6 dígitos numéricos.");
    }

    const tokenHash = createHash('sha256').update(normalizedCodigo).digest('hex');
    const authToken = await this.tokenRepository.findByToken(tokenHash);

    if (!authToken || authToken.type !== AUTH_TOKEN_TYPE.VERIFY_EMAIL || authToken.expiresAt < new Date()) {
      throw new BadRequestException("Código inválido ou expirado.");
    }

    await this.userRepository.update(authToken.userId, { active: true });
    await this.tokenRepository.delete(authToken.id);
  }

  // ==========================================
  // LOGIN
  // ==========================================
  async login(data: LoginRequestDto): Promise<LoginResponseDto> {
    let user = null;
    if (data.identificador.includes("@")) {
      user = await this.userRepository.findByEmail(data.identificador);
    } else {
      user = await this.userRepository.findByUsuario(data.identificador);
    }

    if (!user || !(await bcrypt.compare(data.senha, user.senha))) {
      throw new UnauthorizedException("Credenciais incorretas.");
    }

    if (!user.active) {
      throw new UnauthorizedException("Por favor, verifique seu e-mail antes de acessar.");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new InternalServerErrorException("Erro de configuração.");

    const token = jwt.sign({ id: user.id, perfil: user.perfil }, secret, { expiresIn: "1d" });

    return { token, user: this.mapToResponseDto(user) };
  }

  // ==========================================
  // ESQUECI A SENHA / RESET
  // ==========================================
  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    if (!user.id) {
      throw new InternalServerErrorException("Usuário inválido para recuperação de senha.");
    }

    const token = randomInt(0, 1000000).toString().padStart(6, "0");
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.tokenRepository.create(user.id, tokenHash, AUTH_TOKEN_TYPE.RESET_PASSWORD, expiresAt);

    await this.emailService.sendEmail(
      email,
      "Recuperação de Senha — Apaixone-se",
      `Olá!\n\nRecebemos uma solicitação para redefinir a sua senha.\n\nSeu código de recuperação é: ${token}\n\nEste código expira em 30 minutos. Se você não solicitou a recuperação, ignore este e-mail.\n\nAtenciosamente,\nEquipe Apaixone-se`,
      `<div style="font-family: Arial, Helvetica, sans-serif; background-color: #f5f7fb; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e6ebf2;">
          <h2 style="margin: 0 0 8px; color: #1f2937; font-size: 22px;">Recuperação de Senha</h2>
          <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">
            Olá! Recebemos uma solicitação para redefinir a sua senha.
          </p>
          <p style="margin: 0 0 8px; color: #374151;">Use o código abaixo:</p>
          <div style="display: inline-block; margin: 6px 0 24px; padding: 14px 24px; background: #eef2ff; color: #1d4ed8; border-radius: 10px; font-size: 36px; letter-spacing: 10px; font-weight: 700; font-family: monospace;">
            ${token}
          </div>
          <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
            Este código expira em <strong>30 minutos</strong>.
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Se você não solicitou a recuperação, ignore este e-mail.
          </p>
        </div>
      </div>`
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const normalizedToken = (token || "").trim();
    if (!/^\d{6}$/.test(normalizedToken)) {
      throw new BadRequestException("O código deve ter 6 dígitos numéricos.");
    }

    const tokenHash = createHash('sha256').update(normalizedToken).digest('hex');
    const authToken = await this.tokenRepository.findByToken(tokenHash);

    if (!authToken || authToken.type !== AUTH_TOKEN_TYPE.RESET_PASSWORD || authToken.expiresAt < new Date()) {
      throw new BadRequestException("Código inválido ou expirado.");
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update(authToken.userId, { senha: senhaCriptografada });
    await this.tokenRepository.delete(authToken.id);
  }

  // ==========================================
  // OUTROS MÉTODOS (findAll, findById, update, delete)
  // ==========================================
  async findAll(usuarioLogado: IUsuarioLogado): Promise<UserResponseDto[]> {
    if (usuarioLogado.perfil !== "ADMIN") throw new ForbiddenException("Apenas administradores.");
    const users = await this.userRepository.findAll();
    return users.map((user) => this.mapToResponseDto(user));
  }

  async findById(id: string, usuarioLogado: IUsuarioLogado): Promise<UserResponseDto> {
    if (usuarioLogado.perfil !== "ADMIN" && usuarioLogado.id !== id) throw new ForbiddenException("Sem permissão.");
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    return this.mapToResponseDto(user);
  }

  async update(id: string, data: any, usuarioLogado: IUsuarioLogado) {
    if (usuarioLogado.perfil !== "ADMIN" && usuarioLogado.id !== id) throw new ForbiddenException("Sem permissão.");
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    if (data.senha) {
      const salt = await bcrypt.genSalt(10);
      data.senha = await bcrypt.hash(data.senha, salt);
    }
    const atualizado = await this.userRepository.update(id, data);
    return this.mapToResponseDto(atualizado);
  }

  async delete(id: string, usuarioLogado: IUsuarioLogado): Promise<void> {
    if (usuarioLogado.perfil !== "ADMIN" && usuarioLogado.id !== id) throw new ForbiddenException("Sem permissão.");
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    await this.userRepository.delete(id);
  }

  private mapToResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      email: user.email,
      perfil: user.perfil,
      active: user.active,
      createdAt: user.createdAt,
    };
  }
}
