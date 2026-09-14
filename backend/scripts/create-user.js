"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const readline_1 = __importDefault(require("readline"));
const prisma = new client_1.PrismaClient();
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const question = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};
async function main() {
    console.log('\n🔒 --- Criação / Atualização de Conta do Terapeuta ---');
    const email = (await question('\nDigite seu e-mail: ')).trim();
    if (!email || !email.includes('@')) {
        console.error('❌ E-mail inválido.');
        process.exit(1);
    }
    const name = (await question('Digite seu nome completo profissional: ')).trim();
    const password = (await question('Digite uma senha forte (mínimo 8 caracteres): ')).trim();
    if (password.length < 8) {
        console.error('❌ A senha deve ter pelo menos 8 caracteres.');
        process.exit(1);
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        await prisma.user.update({
            where: { email },
            data: { name, passwordHash, failedLoginAttempts: 0, lockedUntil: null },
        });
        console.log(`\n✅ Conta atualizada com sucesso para ${email}!`);
    }
    else {
        await prisma.user.create({
            data: { email, name, passwordHash },
        });
        console.log(`\n✅ Conta criada com sucesso para ${email}!`);
    }
    await prisma.professionalSettings.upsert({
        where: { id: 'default' },
        update: { therapistName: name },
        create: { id: 'default', therapistName: name, crp: '00/00000' },
    });
}
main()
    .catch(console.error)
    .finally(async () => {
    rl.close();
    await prisma.$disconnect();
});
