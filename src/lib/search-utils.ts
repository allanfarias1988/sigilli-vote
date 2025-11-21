// src/lib/search-utils.ts

/**
 * Utilitários para busca de membros conforme RF-05
 * Ref: docs/signa-sistema-gerenciamento-nomeacoes-adventista.md (linhas 150-152, 283-289)
 */

export interface Member {
    id: string;
    nome_completo: string;
    [key: string]: any;
}

/**
 * Normaliza string removendo acentos
 * Mantém a string original para exibição, mas permite busca sem acentos
 * 
 * @example
 * normalizeString("José") // "Jose"
 * normalizeString("María") // "Maria"
 */
export function normalizeString(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca membros por prefixo conforme RF-05
 * 
 * Regras:
 * - "A" → retorna membros cujo primeiro nome começa com "A"
 * - "Ana" → retorna membros cujo primeiro nome começa com "Ana"
 * - Se nenhum match no primeiro nome, busca em sobrenomes
 * - Busca é case-insensitive e ignora acentos
 * 
 * @param members Lista de membros para buscar
 * @param query String de busca
 * @returns Membros filtrados conforme regras
 * 
 * @example
 * // Membros: ["Ana Silva", "Antonio Santos", "Carlos Ana", "Maria Pereira"]
 * searchMembers(members, "A")    // ["Ana Silva", "Antonio Santos"]
 * searchMembers(members, "Ana")  // ["Ana Silva"]
 * searchMembers(members, "Car")  // ["Carlos Ana"]
 */
export function searchMembers(
    members: Member[],
    query: string
): Member[] {
    // Se query vazia, retorna todos os membros
    if (!query.trim()) {
        return members;
    }

    const normalizedQuery = normalizeString(query.toLowerCase().trim());

    // Primeiro: buscar no primeiro nome
    const firstNameMatches = members.filter(member => {
        const parts = member.nome_completo.trim().split(/\s+/);
        if (parts.length === 0) return false;

        const firstName = parts[0];
        const normalizedFirstName = normalizeString(firstName.toLowerCase());

        return normalizedFirstName.startsWith(normalizedQuery);
    });

    // Se encontrou matches no primeiro nome, retorna eles
    if (firstNameMatches.length > 0) {
        return firstNameMatches;
    }

    // Fallback: buscar em sobrenomes (todos exceto o primeiro nome)
    return members.filter(member => {
        const parts = member.nome_completo.trim().split(/\s+/);
        if (parts.length <= 1) return false;

        const lastNames = parts.slice(1);

        return lastNames.some(lastName => {
            const normalizedLastName = normalizeString(lastName.toLowerCase());
            return normalizedLastName.startsWith(normalizedQuery);
        });
    });
}

/**
 * Extrai o primeiro nome de um nome completo
 * @param nomeCompleto Nome completo do membro
 * @returns Primeiro nome
 */
export function getFirstName(nomeCompleto: string): string {
    const parts = nomeCompleto.trim().split(/\s+/);
    return parts[0] || '';
}

/**
 * Extrai os sobrenomes de um nome completo
 * @param nomeCompleto Nome completo do membro
 * @returns Array de sobrenomes
 */
export function getLastNames(nomeCompleto: string): string[] {
    const parts = nomeCompleto.trim().split(/\s+/);
    return parts.slice(1);
}
