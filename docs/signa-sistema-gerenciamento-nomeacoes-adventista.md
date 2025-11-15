# SIGNA - Sistema de Gerenciamento de Nomeações Adventista

- Visão e Objetivos


- Visão: Tornar as comissões de nomeações transparentes, organizadas, anônimas (quando desejado) e eficientes, do levantamento de sugestões à votação final, com auditoria e resultados consultáveis.
- Objetivos:
  - Orquestrar todo o ciclo de vida de comissões e pesquisas vinculadas.
  - Garantir sigilo/anonimato e integridade dos votos.
  - Fornecer relatórios claros, exportáveis e acessíveis.
  - Oferecer experiência moderna, leve e intuitiva.
- Pilares não-funcionais:
  - Clean Code, SOLID, Clean Architecture (sem over engineering).
  - Modularidade por features; escalabilidade.
  - Multi-tenancy com isolamento forte por igreja.
  - Tempo real confiável; persistência consistente.
  - Segurança (RLS, papéis, logs de auditoria).

---

# Papéis e Atores

- Administrador da Comissão (Admin): cria e gerencia comissões, configura cargos, controla fluxo, pode editar/apagar membros, importar listas, reabrir/encerrar sessão, definir modo de anonimato.
- Participante (Votante): acessa via link/QR, participa de pesquisa e/ou votação de forma anônima ou identificada (conforme configuração).
- Observador/Consulta: acesso somente leitura aos resultados finais (público da sessão).
- Administrador da Igreja (Tenant Admin): configura dados institucionais, gerencia admins de comissões, políticas, e histórico.
- Sistema (Automação): gera links curtos, QR codes, notifica eventos, aplica RLS, emite relatórios, controla realtime.

---

# Fluxo Cronológico (End-to-End)

1) Onboarding e Multi-Tenancy
- Criação da igreja (tenant) e do primeiro Administrador da Igreja.
- Configuração básica: nome, logotipo, fuso horário, ano corrente de nomeações, políticas de anonimato padrão.
- Aplicar RLS no Supabase por tenant_id.

2) Boas-vindas (Landing)
- Tela inicial com apresentação objetiva e ênfase em anonimato e sigilo.
- Ações rápidas:
  - Iniciar nova comissão (gera link/QR).
  - Configurar/Iniciar uma pesquisa de sugestões (opcional, com link/QR próprio).
  - Entrar em uma sessão existente via link/QR.
  - Acessar resultados (somente leitura quando finalizada).
  - Gerenciar igreja, membros, pesquisas e comissões (admins).

3) Preparação de Dados
- Importar lista de membros (PDF ou CSV).
- Pipeline de sanitização:
  - Extrair texto do PDF; normalizar quebras de linha; remover duplicidades.
  - Trim de espaços, remoção de caracteres inválidos, normalização de múltiplos espaços.
  - Colocar nomes em MAIÚSCULAS; manter acentos (recomendado para português).
  - Ordenar alfabeticamente; deduplicar por nome + data de nascimento (se disponível).
  - Validar campos obrigatórios e coerência (e.g., data de batismo, e-mail).
- Persistir em tabelas do tenant no Supabase.

4) Pesquisa (Opcional, mas vinculável à comissão)
- Criar pesquisa de sugestões “Pesquisa — Sugestão para Líderes [ano_atual + 1]”.
- Gerar link curto/QR para que a igreja faça as indicações.
- Vínculo: a pesquisa deverá estar vinculada a uma comissão; os nomes sugeridos e contagem de votos irão ranquear candidatos nos cargos correspondentes.

5) Configuração da Comissão
- Nome da comissão, ano, descrição.
- Selecionar cargos a serem votados, com possibilidade de:
  - Usar lista padrão (ver seção “Cargos padrão”) e personalizar (adicionar/remover/renomear).
  - Definir quantidade de pessoas elegíveis por cargo (cardinalidade por cargo).
- Definir anonimato: anônimo por padrão; alternar para obrigatório/optativo de identificação.
- Vincular a pesquisa (se existir) para ranquear candidatos por cargo.

6) Sessão de Votação (Tempo Real)
- Admin inicia a sessão de votação; sistema gera link curto/QR.
- Participantes entram na sala; presença em tempo real.
- Para cada cargo (um de cada vez, sequencial):
  - Exibir nome do cargo.
  - Lista de membros:
    - Topo: ranqueados por votos na pesquisa (se houver), com contagem ao lado.
    - Abaixo: demais membros, ordenados alfabeticamente.
    - Cada item: nome completo, avatar/imagem à direita, contagem da pesquisa.
  - Busca por nome:
    - Ao digitar “A” → listar apenas nomes que começam com “A”.
    - Com mais letras, filtrar por prefixo do primeiro nome prioritariamente; se não houver match no primeiro nome, buscar em sobrenomes.
  - Votação:
    - Seleção conforme cardinalidade do cargo (ex: até 2 nomes).
    - Envio em tempo real; todos veem contagens atualizando.
- Observações e Controle entre cargos:
  - Admin pode remover/substituir nomes deste cargo, anular e reiniciar votação deste cargo.
  - Se sem observações, seguir para o próximo cargo (sincronização automática nas telas).

7) Encerramento e Finalização
- Ao concluir todos os cargos, mostrar resultados consolidados.
- Admin pode:
  - Reabrir sessão para edição (se permitido).
  - Finalizar sessão de forma irreversível:
    - Exigir confirmação + chave de 6 dígitos gerada pelo sistema.
    - Após finalizada, edição bloqueada definitivamente.

8) Resultados e Relatórios
- Resultado final (somente leitura a todos com o link):
  - Relatório gráfico por cargo (votos recebidos; vencedores).
  - Relatório escrito conciso com informações relevantes.
- Exports:
  - PDF e Markdown (para publicação/arquivamento).
- Histórico:
  - Resultados sempre disponíveis via link da sessão (que passa a ser de consulta).
  - A igreja tem acesso a resultados de anos anteriores e múltiplas comissões por ano.

---

# Conteúdo da Tela de Boas-Vindas (sugestão)

- Título: “Bem-vindo ao SIGNA”
- Subtítulo: “Sistema de Gerenciamento de Nomeações Adventista”
- Mensagem de sigilo:
  - “Privacidade em primeiro lugar: seu voto é anônimo por padrão, salvo quando necessário e acordado entre todos. Toda a apuração ocorre com segurança e integridade.”
- Ações principais:
  - [Iniciar nova comissão] (admin) — Gera link curto e QR para participantes
  - [Iniciar/Configurar pesquisa de sugestões] (admin) — Gera link curto/QR
  - [Entrar via link/QR] (participante)
  - [Resultados] (somente leitura quando finalizada)
  - [Gerenciar igreja] (admin)
  - [Ajuda e privacidade]
- Rodapé: informações do tenant (logo, nome da igreja) e termos de uso/privacidade.

---

# Requisitos Funcionais (RF)

RF-01 Multi-tenant
- Cada igreja é um tenant com dados isolados por tenant_id e políticas RLS no Supabase.

RF-02 Importação de Membros (PDF/CSV)
- Upload (admin), extração (PDF), sanitização, normalização, MAIÚSCULAS, ordenação, dedupe, persistência.
- Campos mínimos: ID (gerado), NOME_COMPLETO, APTIDÃO_PARA_PARTICIPAR (boolean), DATA_NASC, ANO_BATISMO (opcional).
- Campos adicionais: cargos atuais, interesses, tempo no cargo, imagem, telefone, e-mail, estado civil, endereço.

RF-03 Pesquisa de Sugestões (Opcional)
- Criação e link/QR exclusivos.
- Votos de sugestões por cargo, contabilização e ranking.
- Vincular a uma comissão (pode ser criada antes ou durante a comissão).

RF-04 Comissões
- Criar e configurar: nome/ano, cargos e cardinalidade, anonimato, vincular pesquisa.
- Gerar link/QR para sessão de votação.
- Admin é o criador da sessão.

RF-05 Votação por Cargo (Sequencial e Tempo Real)
- Exibir cargo atual, lista de candidatos:
  - Ranqueados (se pesquisa) com contagem ao lado.
  - Demais membros ordenados alfabeticamente.
- Busca:
  - Prefixo do primeiro nome; fallback para sobrenomes.
  - “A” → somente quem começa com A; “Ana” → começa com “Ana”; se nada no primeiro nome, buscar sobrenomes.
- Seleção conforme cardinalidade; envio em tempo real; contagens ao vivo.
- Admin pode anular e refazer um cargo, remover/substituir nomes, ou avançar.

RF-06 Persistência e Imutabilidade
- Votos persistidos com timestamps, cargo, sessão e hash de integridade.
- Imutáveis por padrão; somente admin pode ativar modo de edição.

RF-07 Encerramento
- Finalização irreversível com chave de 6 dígitos e confirmação dupla.
- Após finalização, sessão vira “consulta de resultados”.

RF-08 Relatórios
- Gráficos por cargo (barras/pizza), vencedores e contagens.
- Resumo textual conciso.
- Exportar PDF e Markdown.

RF-09 Gerenciamento
- Páginas:
  - Membros (CRUD, desabilitar/habilitar, detalhes).
  - Comissões (listar, criar, editar, encerrar, reabrir).
  - Pesquisas (criar, vincular, monitorar).
  - Resultados (parciais e finais).
  - Relatórios (filtros, export).
  - Igreja (configurações do tenant, política de anonimato).
- Logs de auditoria (quem fez o quê e quando).

RF-10 Links e QR Codes
- Links curtos únicos por sessão/pesquisa.
- QR gerado dinamicamente.
- Opção de expiração/rotacionar links (admin).

RF-11 Modos de Identificação
- Anônimo por padrão.
- Admin pode tornar identificação obrigatória ou opcional.
- Se identificado, armazenar mapeamento de voto a usuário com criptografia e acesso restrito (política clara).

RF-12 Tempo Real
- Atualização de votos, presença e mudanças de cargo via canais realtime.
- Tolerância a reconexões; estado resiliente.

RF-13 Acessibilidade e Idiomas
- Layout legível, contrastes adequados, suporte a teclado.
- Preparado para i18n (pt-BR primeiro).

---

# Requisitos Não Funcionais (RNF)

- RNF-01 Arquitetura limpa por camadas (domínio, aplicação, infraestrutura, UI).
- RNF-02 Feature-based folders no front-end.
- RNF-03 Desempenho: responsividade < 200ms em operações comuns; 1k participantes concorrentes por sessão (meta v1 conservadora: 200).
- RNF-04 Segurança: RLS por tenant, rate limiting em endpoints sensíveis, hashing de votos/urnas, logs/auditoria.
- RNF-05 Observabilidade: métricas básicas, logs estruturados, auditoria de admin actions.
- RNF-06 Testes: unidade, integração (Supabase), e2e de fluxos críticos.

---

# Cargos Padrão (Pesquisa e Comissão)

1. Anciãos (4 nomes)
2. Secretaria (2)
3. Tesouraria (2)
4. Diaconato (2)
5. Diaconisas (2)
6. Escola Sabatina (2)
7. Ministério Pessoal (2)
8. Mordomia Cristã (2)
9. Ministério de Publicações e Espírito de Profecia (2)
10. Ministério da Família (2)
11. Ministério da Mulher (2)
12. Ministério da Música (2)
13. Ministério da Saúde (2)
14. Ministério da Criança (2)
15. Ministério dos Adolescentes (2)
16. Ministério da Recepção (2)
17. Ministério Jovem (2)
18. Ação Solidária Adventista (ASA) (2)
19. Clube de Aventureiros (2)
20. Clube de Desbravadores (2)
21. Comunicação (2)
22. Interessados (2)
23. Patrimonial (2)
24. Sonoplastia (2)
25. Relações Públicas e Liberdade Religiosa (2)
26. Autoindicação (texto livre)
27. Nome do participante (obrigatório se houver autoindicação)

Observação: na comissão, a cardinalidade pode variar por cargo e ser configurada pelo admin.

---

# Modelo de Dados (Supabase/Postgres — esboço)

- tenants
  - id (uuid), nome, slug, timezone, created_at
- users
  - id (uuid), tenant_id, nome, email, telefone, role (tenant_admin, commission_admin, voter, viewer), created_at
- churches (opcional se quiser separar de tenants)
  - id, tenant_id, nome, endereço, config (jsonb)
- members
  - id (uuid), tenant_id, nome_completo, apelido, imagem_url, telefone, email, data_nasc, estado_civil, endereco, ano_batismo, apto (bool), cargos_atuais (text[]), interesses (text[]), tempo_no_cargo (int), created_at
- commissions
  - id (uuid), tenant_id, nome, ano, descricao, pesquisa_id (nullable), anonimato_modo (anonimo|obrigatorio|opcional), status (draft|aberta|finalizada), link_code (varchar base62), created_by, created_at, finalized_at
- commission_roles (cargos configurados por comissão)
  - id, commission_id, nome_cargo, max_selecoes (int), ordem (int), ativo (bool)
- sessions (opcional; se comissão tiver múltiplas sessões)
  - id, commission_id, status (aberta|finalizada), link_code, created_at
- surveys
  - id (uuid), tenant_id, titulo, ano, descricao, link_code, status (aberta|fechada), created_at
- survey_items
  - id, survey_id, cargo_nome, max_sugestoes
- survey_votes
  - id, survey_id, cargo_nome, member_id, count (int), created_at
- ballots
  - id, commission_id, role_id, voter_id (nullable se anônimo), signature_hash, created_at
- votes
  - id, ballot_id, member_id, created_at
- realtime_presence
  - id, commission_id|session_id, user_id/null, joined_at, left_at
- results_cache
  - id, commission_id, snapshot_json, created_at
- audit_log
  - id, tenant_id, actor_id, entity_type, entity_id, action, details_json, created_at
- short_links
  - id, tenant_id, code, target (commission|survey|result), target_id, expires_at (nullable), created_at

Políticas RLS: todas as tabelas acima com filtro por tenant_id, além de regras de acesso por papel e status da comissão/survey.

---

# Regras de Busca por Nome

- Entrada de 1 letra: listar somente membros cujo primeiro nome começa pelo prefixo.
- Entrada com N letras: buscar prefixo no primeiro nome prioritariamente.
- Fallback: buscar prefixo em sobrenomes quando não houver match no primeiro nome.
- Normalização: comparar acentos e variações (usar ILIKE/unaccent se necessário, sem perder acentos na exibição).
- Ordenação: match no primeiro nome antes dos matches em sobrenome; dentro do mesmo grupo, alfabética.

---

# Regras de Votação e Integridade

- Cada eleitor emite 1 cédula (ballot) por cargo, respeitando max_selecoes.
- Voto em tempo real com confirmação de envio e estado local resiliente (retry/backoff).
- Assinatura da cédula:
  - signature_hash = hash(ballot_id + commission_id + role_id + server_nonce)
- Imutabilidade:
  - Bloqueio de edição por padrão; modo de edição só se admin ativar e antes da finalização da sessão.
- Anulação de cargo: invalida votos do cargo e reinicia fase daquele cargo.
- Finalização:
  - Gera chave de 6 dígitos (TOTP-like, mas estático no momento da finalização).
  - Exige digitação da chave + confirmação.
  - Torna sessão “somente leitura” permanentemente.

---

# Páginas e Navegação

- Boas-vindas (landing)
- Autenticação (se necessário para admins)
- Gerenciar Igreja (tenant)
  - Dados da igreja, logo, fuso, políticas de anonimato
- Membros
  - Lista com filtros, busca, importação PDF/CSV
  - CRUD, desativar/ativar, detalhes
- Pesquisas
  - Criar, configurar cargos/itens, gerar link/QR
  - Monitorar contagens
- Comissões
  - Criar, configurar cargos, vincular pesquisa
  - Iniciar/pausar/reabrir/finalizar
  - Painel de controle por cargo e contagem
- Votação (participante)
  - Formulário sequencial por cargo
  - Lista ranqueada + demais, busca, seleção
  - Progresso e confirmação
- Resultados
  - Parciais (se permitido) e finais (somente leitura após finalização)
  - Gráficos e texto
  - Export PDF/Markdown
- Relatórios
  - Filtros por ano, comissão, cargo
  - Exportações e snapshots
- Ajuda/Privacidade

---

# Stack e Arquitetura (sugestão)

- Front-end: Next.js/React, TypeScript, TailwindCSS.
- Back-end/BaaS: Supabase (Auth, Postgres, Storage, Realtime, RLS).
- Estado: Zustand/Redux Toolkit (conforme preferência), ou server components + caches.
- Real-time: Supabase Realtime channels (commission:{id}, role:{id}, survey:{id}).
- Short links: tabela short_links com base62 e redirecionamento server-side.
- Export PDF: headless Chromium (Playwright/Puppeteer) ou serviço de renderização serverless.
- Clean Architecture:
  - domain: entidades, regras de negócio.
  - application: casos de uso, portas.
  - infrastructure: Supabase adapters, repos.
  - presentation: páginas, componentes, view-models.
- Feature folders: members, surveys, commissions, voting, results, reports, church.

---

# Segurança e Privacidade

- RLS por tenant_id e por status (votação/resultado).
- Separação de poderes: tenant_admin vs commission_admin vs voter vs viewer.
- Anonimato:
  - Modo padrão anônimo: não guardar vínculo voto–pessoa.
  - Modos obrigatório/opcional: se identificado, criptografar vinculação com acesso restrito apenas a commission_admin sob justificativa e audit_log.
- Proteções:
  - Rate limiting em links públicos; captchas conforme necessário.
  - Expiração/rotação de links se habilitado.
- Auditoria:
  - Logar todas ações administrativas e transições de estado.

---

# Relatórios

- Gráficos:
  - Por cargo: barras horizontais com contagem de votos; destaque para eleitos.
- Texto conciso:
  - “Cargo: Tesouraria — Eleitos: FULANO, BELTRANO (X votos).”
- Export:
  - PDF (estilizado, timbrado com logo da igreja).
  - Markdown (simples, versionável).
- Histórico e comparativos entre anos (v2).

---

# Roadmap de Entrega (incremental)

- M0: Setup multi-tenant, RLS, base do projeto, design system.
- M1: Importação de membros (CSV), CRUD de membros, busca.
- M2: Pesquisas (itens + contagem), links curtos/QR.
- M3: Comissões (configuração de cargos, vincular pesquisa).
- M4: Votação tempo real por cargo, busca com regras, contagem ao vivo.
- M5: Observações do admin por cargo (remover/substituir/anular).
- M6: Encerramento com chave de 6 dígitos e bloqueio irreversível.
- M7: Resultados finais, relatórios e export (PDF/Markdown).
- M8: Importação PDF, refinamentos, acessibilidade, testes, hardening.

---

# Critérios de Aceite (amostra)

- Importação CSV sanitiza nomes, aplica MAIÚSCULAS, ordena e persiste sem duplicatas.
- Busca retorna prefixos de primeiro nome; fallback para sobrenomes.
- Votos aparecem em tempo real em até 500ms para 100 participantes.
- Admin consegue anular e refazer votação de um cargo sem afetar os demais.
- Finalização exige chave correta e torna sessão somente leitura.
- Relatório PDF contém vencedores e contagens por cargo.

---

# Prompt de Execução para IA (tarefas pequenas, sem alucinação)

Objetivo: Implementar o sistema “SIGNA” seguindo Clean Architecture, modular por features, e os requisitos acima, em entregas pequenas, verificáveis.

Instruções Gerais:
- Trabalhe em micro-tarefas com escopo fechado (no máximo 2–4 horas de trabalho por tarefa).
- Sempre produza:
  - Objetivo da tarefa (1–2 frases)
  - Saída esperada (artefatos, endpoints, telas)
  - Passos concretos (lista numerada)
  - Assunções (se houver)
  - Testes/validação (como verificar)
  - Limitações e próximos passos
- Não invente requisitos. Se algo não estiver especificado, peça esclarecimento ou proponha 1–2 opções com prós/cons e siga a preferida.
- Mantenha consistência com o modelo de dados e as regras deste documento.
- Evite “pensamento em voz alta” no output; forneça um breve “Resumo de raciocínio” (máx. 3 linhas), sem expor cadeias internas.

Ordem Recomendada (pinned):

(1) Fundações do Projeto
- Objetivo: Estruturar repositório, lint, testes, CI básico, Supabase e RLS por tenant.
- Saída: repo com app esqueleto; schema inicial tenants/users; política RLS; doc de setup.

(2) Membros — Importação CSV
- Objetivo: Upload CSV e pipeline de sanitização.
- Saída: endpoint/upload, job de parsing, persistência em members; UI de import.
- Passos: parsing; normalização MAIÚSCULAS; ordenação; dedupe; validação de campos; testes.
- Validação: importar amostra com 100 nomes, sem duplicatas, ordenados.

(3) Membros — Lista e CRUD
- Objetivo: Tela de gerenciamento com busca (prefixo) e filtros.
- Saída: página Membros operante; testes e2e.

(4) Pesquisas — Criação e Votos
- Objetivo: Criar survey com itens (cargos padrão) e registrar votos de sugestões.
- Saída: links curtos, QR, contagem por cargo; UI mínima de envio.
- Validação: contagens refletidas no dashboard admin.

(5) Comissões — Configuração
- Objetivo: Criar comissão, definir cargos e cardinalidade, vincular pesquisa.
- Saída: UI e persistência; RLS por comissão.

(6) Votação — Realtime e Busca
- Objetivo: Fluxo por cargo com lista ranqueada + demais; busca por prefixo (fallback sobrenomes).
- Saída: canal realtime, contagem ao vivo; testes de latência.

(7) Observações do Admin por Cargo
- Objetivo: Remoção/substituição de nomes e anulação/refeito do cargo.
- Saída: comandos admin; logs em audit_log.

(8) Encerramento com Chave
- Objetivo: Finalização irreversível com chave de 6 dígitos.
- Saída: modal de confirmação, geração/validação de chave, bloqueio de edição.

(9) Resultados e Relatórios
- Objetivo: Relatórios gráficos + texto; export PDF/Markdown; página somente leitura.
- Saída: downloads e link público.

Formato de Resposta de Cada Tarefa:
- Objetivo
- Saída Esperada
- Passos
- Assunções
- Testes/Validação
- Limitações/Próximos Passos
- Resumo de raciocínio (3 linhas)

Padrões Técnicos:
- Clean Architecture (camadas), feature folders, TypeScript estrito.
- Supabase: RLS por tenant, canais realtime, storage para imagens, rotas seguras.
- Acessibilidade e responsividade básicos.
- Logs estruturados e auditoria de ações de admin.

---

# Observações e Riscos

- PDF parsing pode exigir validação manual em casos de formatação complexa.
- Anonimato com identificação opcional: documentar claramente o comportamento e acesso a dados.
- Realtime: testar cenários de reconexão e consistência de contagem.
- Escopo v1: priorizar fluxo crucial; recursos avançados (comparativos anuais) podem ficar para v2.
