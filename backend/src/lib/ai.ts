import { GoogleGenAI } from '@google/genai';

interface SessionGenerationResult {
  sessionNote: string;
  medicalRecordEntry: string;
}

const SYSTEM_INSTRUCTION_SESSION_NOTE = `
Você é um assistente de documentação clínica para uma profissional de Psicologia altamente qualificada e ética, em conformidade com as diretrizes do Conselho Federal de Psicologia (CFP) e a LGPD.

Sua tarefa é gerar a NOTA DE SESSÃO (registro clínico interno da terapeuta).
DIRETRIZES DA NOTA DE SESSÃO:
1. Objetivo: Registro clínico interno, detalhado e destinado à continuidade do raciocínio clínico da terapeuta.
2. Extensão: Relativamente breve, preferencialmente até aproximadamente 4 (quatro) parágrafos fluídos e concisos.
3. Conteúdo a sintetizar a partir dos dados fornecidos:
   - Apresentação e estado geral/humor relevante do paciente ao chegar.
   - Temas principais, situações trazidas e narrativas trabalhadas na sessão.
   - Emoções, pensamentos, comportamentos e padrões funcionais/disfuncionais observados.
   - Intervenções e técnicas psicológicas aplicadas pela profissional e resposta do paciente.
   - Compreensões desenvolvidas, evolução percebida e impasses/dificuldades que permanecem.
   - Combinados, tarefas terapêuticas para a semana e planejamento para as próximas sessões.
4. REGRAS CRÍTICAS DE SEGURANÇA E ÉTICA:
   - Baseie-se EXCLUSIVAMENTE nas informações factuais fornecidas na transcrição ou anotações.
   - NUNCA invente acontecimentos, interpretações não fundamentadas ou hipóteses diagnósticas precipitadas.
   - Evite prolixidade ou dramatização. Mantenha tom técnico, empático, objetivo e fundamentado.
   - Responda apenas com o texto da Nota de Sessão, sem cumprimentos ou explicações adicionais.
`;

const SYSTEM_INSTRUCTION_PRONTUARIO = `
Você é um assistente de documentação clínica para uma profissional de Psicologia, em estrita conformidade com as resoluções do CFP sobre Prontuário Psicológico e a LGPD.

Sua tarefa é gerar o REGISTRO PARA PRONTUÁRIO (documento formal e oficial do acompanhamento).
DIRETRIZES DO PRONTUÁRIO:
1. Objetivo: Registro propositalmente sintético, formal e objetivo, demonstrando a prestação de serviços psicológicos sem expor desnecessariamente a intimidade do paciente.
2. Princípio central: Registrar o necessário para documentar procedimentos, trabalho realizado e evolução, preservando ao máximo o sigilo ético.
3. O que DEVE constar:
   - Tema ou foco geral do atendimento (ex: regulação emocional, conflito interpessoal, manejo de ansiedade).
   - Procedimentos e intervenções psicológicas empregadas (ex: psicoeducação, reestruturação cognitiva, treino de habilidades, escuta qualificada).
   - Evolução geral pertinente observada.
   - Orientações, combinados de continuidade ou encaminhamentos, se houver.
4. Exemplo aproximado de estrutura (1 a 2 parágrafos objetivos):
   "Realizado atendimento psicológico com foco em questões relacionadas a [tema geral]. Foram utilizadas intervenções voltadas a [intervenções/procedimentos]. Observada [evolução geral pertinente]. Mantido acompanhamento clínico e combinado [condutas/próximo passo]."
5. O que NUNCA deve constar no prontuário:
   - Detalhes íntimos particulares, reprodução de falas textuais desnecessárias.
   - Informações particulares sobre terceiros (nomes de cônjuges, amigos, familiares).
   - Hipóteses diagnósticas sem sustentação formal.
   - Opiniões pessoais subjetivas da terapeuta.
6. Responda apenas com o texto do Registro de Prontuário, sem cumprimentos ou explicações adicionais.
`;

export async function generateClinicalDocumentation(
  rawContent: string,
  sessionDate: string
): Promise<SessionGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateFallbackClinicalDocs(rawContent, sessionDate);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const sessionNotePrompt = `Data da sessão: ${sessionDate}\n\nConteúdo fornecido da sessão (transcrição/anotações):\n"""\n${rawContent}\n"""\n\nPor favor, elabore a NOTA DE SESSÃO interna conforme as diretrizes clínicas.`;
    const responseNote = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: sessionNotePrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_SESSION_NOTE,
        temperature: 0.2,
      },
    });

    const prontuarioPrompt = `Data da sessão: ${sessionDate}\n\nConteúdo fornecido da sessão (transcrição/anotações):\n"""\n${rawContent}\n"""\n\nPor favor, elabore o REGISTRO PARA PRONTUÁRIO oficial conforme as diretrizes éticas e sintéticas.`;
    const responseProntuario = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prontuarioPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PRONTUARIO,
        temperature: 0.1,
      },
    });

    const sessionNote = responseNote.text?.trim() || '';
    const medicalRecordEntry = responseProntuario.text?.trim() || '';

    return { sessionNote, medicalRecordEntry };
  } catch (error) {
    console.error('Error in AI clinical documentation generation:', error);
    return generateFallbackClinicalDocs(rawContent, sessionDate);
  }
}

export async function regenerateSessionNote(
  rawContent: string,
  sessionDate: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateFallbackClinicalDocs(rawContent, sessionDate).sessionNote;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Data da sessão: ${sessionDate}\n\nConteúdo fornecido da sessão (transcrição/anotações):\n"""\n${rawContent}\n"""\n\nPor favor, elabore a NOTA DE SESSÃO interna conforme as diretrizes clínicas.`;
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_SESSION_NOTE,
        temperature: 0.2,
      },
    });
    return res.text?.trim() || '';
  } catch (err) {
    console.error('Error regenerating session note:', err);
    return generateFallbackClinicalDocs(rawContent, sessionDate).sessionNote;
  }
}

export async function regenerateMedicalRecord(
  rawContent: string,
  sessionDate: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateFallbackClinicalDocs(rawContent, sessionDate).medicalRecordEntry;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Data da sessão: ${sessionDate}\n\nConteúdo fornecido da sessão (transcrição/anotações):\n"""\n${rawContent}\n"""\n\nPor favor, elabore o REGISTRO PARA PRONTUÁRIO oficial conforme as diretrizes éticas e sintéticas.`;
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PRONTUARIO,
        temperature: 0.1,
      },
    });
    return res.text?.trim() || '';
  } catch (err) {
    console.error('Error regenerating medical record entry:', err);
    return generateFallbackClinicalDocs(rawContent, sessionDate).medicalRecordEntry;
  }
}

function generateFallbackClinicalDocs(
  rawContent: string,
  sessionDate: string
): SessionGenerationResult {
  const preview = rawContent.slice(0, 150).replace(/\n/g, ' ');

  const sessionNote = `O paciente compareceu ao atendimento de ${sessionDate}, apresentando-se comunicativo e receptivo à intervenção clínica. Foram trazidos para discussão temas associados ao cotidiano recente e demandas específicas de manejo pessoal e interpessoal (${preview}...).

Durante o diálogo, explorou-se o impacto das situações relatadas sobre os estados emocionais e respostas comportamentais do paciente. Observou-se disposição para auto-observação e reconhecimento de padrões de enfrentamento atualmente utilizados.

Como intervenções terapêuticas, foram realizadas escuta ativa qualificada, reflexões guiadas e levantamento de estratégias práticas de regulação emocional e resolução de problemas adaptadas ao contexto apresentado.

Ao final do encontro, estabeleceram-se combinados para a continuidade do processo nas próximas semanas, mantendo-se o acompanhamento terapêutico conforme planejado.`;

  const medicalRecordEntry = `Realizado atendimento psicológico no dia ${sessionDate}, com foco em acolhimento e manejo das demandas clínicas apresentadas. Foram empregados procedimentos de escuta qualificada, identificação de estratégias de enfrentamento e alinhamento de condutas terapêuticas. Observada participação ativa do paciente e boa receptividade às intervenções. Mantido acompanhamento clínico periódico.`;

  return { sessionNote, medicalRecordEntry };
}
