export type NivelFalha = 'baixo' | 'medio' | 'grave';
export type TipoProjeto = 'Financeiro' | 'Administrativo';
export type Categoria = 'Junior' | 'Senior';
export type TipoFuncionario = 'efetivo' | 'contratado';

export type Setor = { id: string; descricao: string; sigla: string };
export type Cargo = {
  codigo: string;
  descricao: string;
  salario: number;
  ultimoAjuste: string;
};
export type Funcionario = {
  matricula: string;
  nome: string;
  sexo?: string;
  endereco: string;
  telefones: string[];
  diaNascimento: number;
  mesNascimento: number;
  anoNascimento: number;
  setorId: string;
  cargoCodigo: string;
  gerenteMatricula?: string;
  tipo: TipoFuncionario;
};
export type Projeto = {
  id: string;
  descricao: string;
  tipo: TipoProjeto;
  orcamento: number;
  inicio: string;
  patrocinador?: string;
  verbaLimite?: number;
};
export type Participacao = {
  id: string;
  projetoId: string;
  funcionarioMatricula: string;
  entrada: string;
  saida?: string;
};
export type Falha = { codigo: string; descricao: string; nivel: NivelFalha };
export type Teste = {
  id: string;
  projetoId: string;
  funcionarioMatricula: string;
  data: string;
  falhaCodigos: string[];
};
export type Dependente = {
  id: string;
  funcionarioMatricula: string;
  nome: string;
  nascimento: string;
  parentesco: string;
};
export type Progressao = {
  codigo: string;
  funcionarioMatricula: string;
  ultimaProgressao: string;
  categoria: Categoria;
};

export type AppData = {
  setores: Setor[];
  cargos: Cargo[];
  funcionarios: Funcionario[];
  projetos: Projeto[];
  participacoes: Participacao[];
  falhas: Falha[];
  testes: Teste[];
  dependentes: Dependente[];
  progressoes: Progressao[];
};

export const initialData: AppData = {
  setores: [
    { id: 'SET-01', descricao: 'Desenvolvimento de Produtos', sigla: 'DEV' },
    { id: 'SET-02', descricao: 'Qualidade de Software', sigla: 'QA' },
    { id: 'SET-03', descricao: 'Administrativo e Pessoas', sigla: 'ADM' },
  ],
  cargos: [
    { codigo: 'C-101', descricao: 'Analista de Sistemas', salario: 7200, ultimoAjuste: '2026-02-10' },
    { codigo: 'C-202', descricao: 'Desenvolvedor Mobile', salario: 8500, ultimoAjuste: '2026-03-18' },
    { codigo: 'C-303', descricao: 'Analista de Testes', salario: 6400, ultimoAjuste: '2026-01-22' },
    { codigo: 'C-404', descricao: 'Coordenador de Projetos', salario: 11200, ultimoAjuste: '2026-04-05' },
  ],
  funcionarios: [
    {
      matricula: 'F001', nome: 'Marina Costa', sexo: 'F', endereco: 'Rua das Interfaces, 120',
      telefones: ['(85) 98800-1200'], diaNascimento: 14, mesNascimento: 5, anoNascimento: 1991,
      setorId: 'SET-01', cargoCodigo: 'C-404', tipo: 'efetivo',
    },
    {
      matricula: 'F002', nome: 'Rafael Nunes', sexo: 'M', endereco: 'Av. Algoritmos, 455',
      telefones: ['(85) 97711-4550', '(85) 3333-4550'], diaNascimento: 9, mesNascimento: 8,
      anoNascimento: 1994, setorId: 'SET-01', cargoCodigo: 'C-202', gerenteMatricula: 'F001',
      tipo: 'efetivo',
    },
    {
      matricula: 'F003', nome: 'Bianca Lima', sexo: 'F', endereco: 'Rua Sprint, 77',
      telefones: ['(85) 96622-7700'], diaNascimento: 23, mesNascimento: 11, anoNascimento: 1996,
      setorId: 'SET-02', cargoCodigo: 'C-303', gerenteMatricula: 'F001', tipo: 'efetivo',
    },
    {
      matricula: 'F004', nome: 'Theo Barros', endereco: 'Rua Backlog, 301',
      telefones: ['(85) 95533-3010'], diaNascimento: 2, mesNascimento: 3, anoNascimento: 1998,
      setorId: 'SET-03', cargoCodigo: 'C-101', gerenteMatricula: 'F001', tipo: 'contratado',
    },
  ],
  projetos: [
    {
      id: 'P-100', descricao: 'Carteira Digital FAB Pay', tipo: 'Financeiro',
      orcamento: 380000, inicio: '2026-01-15', patrocinador: 'Banco Horizonte',
    },
    {
      id: 'P-200', descricao: 'Portal Administrativo Interno', tipo: 'Administrativo',
      orcamento: 160000, inicio: '2026-02-03', verbaLimite: 190000,
    },
    {
      id: 'P-300', descricao: 'Modulo de Conciliacao Financeira', tipo: 'Financeiro',
      orcamento: 245000, inicio: '2026-04-01', patrocinador: 'Cooperativa Alfa',
    },
  ],
  participacoes: [
    { id: 'PAR-01', projetoId: 'P-100', funcionarioMatricula: 'F001', entrada: '2026-01-15' },
    { id: 'PAR-02', projetoId: 'P-100', funcionarioMatricula: 'F002', entrada: '2026-01-20' },
    { id: 'PAR-03', projetoId: 'P-200', funcionarioMatricula: 'F004', entrada: '2026-02-03' },
    { id: 'PAR-04', projetoId: 'P-300', funcionarioMatricula: 'F002', entrada: '2026-04-01' },
    { id: 'PAR-05', projetoId: 'P-300', funcionarioMatricula: 'F003', entrada: '2026-04-08', saida: '2026-05-30' },
  ],
  falhas: [
    { codigo: 'FL-01', descricao: 'Erro de validacao de campos obrigatorios', nivel: 'baixo' },
    { codigo: 'FL-02', descricao: 'Divergencia no calculo de saldo', nivel: 'grave' },
    { codigo: 'FL-03', descricao: 'Lentidao em consulta de historico', nivel: 'medio' },
  ],
  testes: [
    { id: 'T-001', projetoId: 'P-100', funcionarioMatricula: 'F003', data: '2026-05-12', falhaCodigos: ['FL-01', 'FL-03'] },
    { id: 'T-002', projetoId: 'P-300', funcionarioMatricula: 'F003', data: '2026-05-20', falhaCodigos: ['FL-02'] },
    { id: 'T-003', projetoId: 'P-100', funcionarioMatricula: 'F002', data: '2026-05-28', falhaCodigos: [] },
  ],
  dependentes: [
    { id: 'D-01', funcionarioMatricula: 'F001', nome: 'Lia Costa', nascimento: '2018-07-12', parentesco: 'Filha' },
    { id: 'D-02', funcionarioMatricula: 'F002', nome: 'Caio Nunes', nascimento: '2020-09-03', parentesco: 'Filho' },
  ],
  progressoes: [
    { codigo: 'CP-001', funcionarioMatricula: 'F001', ultimaProgressao: '2026-03-01', categoria: 'Senior' },
    { codigo: 'CP-002', funcionarioMatricula: 'F002', ultimaProgressao: '2026-02-12', categoria: 'Junior' },
    { codigo: 'CP-003', funcionarioMatricula: 'F003', ultimaProgressao: '2026-04-18', categoria: 'Junior' },
    { codigo: 'CP-004', funcionarioMatricula: 'F004', ultimaProgressao: '2026-01-30', categoria: 'Junior' },
  ],
};
