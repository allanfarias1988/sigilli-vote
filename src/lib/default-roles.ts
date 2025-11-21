// src/lib/default-roles.ts

/**
 * Definição dos cargos padrão conforme especificação SIGNA
 * Ref: docs/signa-sistema-gerenciamento-nomeacoes-adventista.md (linhas 210-238)
 */

export interface DefaultRole {
    nome: string;
    max_selecoes: number;
    ordem: number;
}

/**
 * Lista dos 27 cargos padrão para comissões de nomeação
 * Baseado na estrutura da Igreja Adventista do Sétimo Dia
 */
export const DEFAULT_ROLES: DefaultRole[] = [
    { nome: 'Anciãos', max_selecoes: 4, ordem: 1 },
    { nome: 'Secretaria', max_selecoes: 2, ordem: 2 },
    { nome: 'Tesouraria', max_selecoes: 2, ordem: 3 },
    { nome: 'Diaconato', max_selecoes: 2, ordem: 4 },
    { nome: 'Diaconisas', max_selecoes: 2, ordem: 5 },
    { nome: 'Escola Sabatina', max_selecoes: 2, ordem: 6 },
    { nome: 'Ministério Pessoal', max_selecoes: 2, ordem: 7 },
    { nome: 'Mordomia Cristã', max_selecoes: 2, ordem: 8 },
    { nome: 'Ministério de Publicações e Espírito de Profecia', max_selecoes: 2, ordem: 9 },
    { nome: 'Ministério da Família', max_selecoes: 2, ordem: 10 },
    { nome: 'Ministério da Mulher', max_selecoes: 2, ordem: 11 },
    { nome: 'Ministério da Música', max_selecoes: 2, ordem: 12 },
    { nome: 'Ministério da Saúde', max_selecoes: 2, ordem: 13 },
    { nome: 'Ministério da Criança', max_selecoes: 2, ordem: 14 },
    { nome: 'Ministério dos Adolescentes', max_selecoes: 2, ordem: 15 },
    { nome: 'Ministério da Recepção', max_selecoes: 2, ordem: 16 },
    { nome: 'Ministério Jovem', max_selecoes: 2, ordem: 17 },
    { nome: 'Ação Solidária Adventista (ASA)', max_selecoes: 2, ordem: 18 },
    { nome: 'Clube de Aventureiros', max_selecoes: 2, ordem: 19 },
    { nome: 'Clube de Desbravadores', max_selecoes: 2, ordem: 20 },
    { nome: 'Comunicação', max_selecoes: 2, ordem: 21 },
    { nome: 'Interessados', max_selecoes: 2, ordem: 22 },
    { nome: 'Patrimonial', max_selecoes: 2, ordem: 23 },
    { nome: 'Sonoplastia', max_selecoes: 2, ordem: 24 },
    { nome: 'Relações Públicas e Liberdade Religiosa', max_selecoes: 2, ordem: 25 },
    { nome: 'Autoindicação', max_selecoes: 1, ordem: 26 },
    { nome: 'Nome do Participante', max_selecoes: 1, ordem: 27 },
];

/**
 * Retorna os cargos padrão prontos para inserção no banco
 * @param commissionId ID da comissão onde os cargos serão inseridos
 * @returns Array de cargos com commission_id e ativo=true
 */
export function getDefaultRolesForCommission(commissionId: string) {
    return DEFAULT_ROLES.map(role => ({
        commission_id: commissionId,
        nome_cargo: role.nome,
        max_selecoes: role.max_selecoes,
        ordem: role.ordem,
        ativo: true,
    }));
}
