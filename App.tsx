import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppData, initialData } from './src/data';
import { loadData, saveData } from './src/storage';

const tabs = ['Painel', 'Cadastros', 'Projetos', 'Testes', 'Modelo'] as const;
type Tab = (typeof tabs)[number];
type EntityKey = keyof AppData;
type FormValues = Record<string, string>;
type Field = {
  key: string;
  label: string;
  required?: boolean;
  numeric?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

const entityLabels: Record<EntityKey, string> = {
  setores: 'Setores',
  cargos: 'Cargos',
  funcionarios: 'Funcionarios',
  projetos: 'Projetos',
  participacoes: 'Participacoes',
  falhas: 'Tipos de falha',
  testes: 'Testes',
  dependentes: 'Dependentes',
  progressoes: 'Cartoes de progressao',
};
const entityKeys = Object.keys(entityLabels) as EntityKey[];
const primaryKeys: Record<EntityKey, string> = {
  setores: 'id',
  cargos: 'codigo',
  funcionarios: 'matricula',
  projetos: 'id',
  participacoes: 'id',
  falhas: 'codigo',
  testes: 'id',
  dependentes: 'id',
  progressoes: 'codigo',
};
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function App() {
  const [data, setData] = useState<AppData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('Painel');
  const [entity, setEntity] = useState<EntityKey>('funcionarios');
  const [form, setForm] = useState<{ entity: EntityKey; originalId?: string } | null>(null);
  const [values, setValues] = useState<FormValues>({});

  useEffect(() => {
    loadData()
      .then(setData)
      .catch(() => Alert.alert('Aviso', 'Nao foi possivel carregar os dados salvos.'))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) saveData(data).catch(() => Alert.alert('Aviso', 'Nao foi possivel salvar os dados.'));
  }, [data, loaded]);

  const fields = useMemo(() => getFields(form?.entity ?? entity, data), [form?.entity, entity, data]);
  const totalOrcamento = data.projetos.reduce((total, item) => total + item.orcamento, 0);
  const projetosFinanceiros = data.projetos.filter((item) => item.tipo === 'Financeiro');
  const testesGraves = data.testes.filter((teste) =>
    teste.falhaCodigos.some((codigo) => data.falhas.find((falha) => falha.codigo === codigo)?.nivel === 'grave'),
  );

  function openForm(target: EntityKey, record?: Record<string, unknown>) {
    const next: FormValues = {};
    getFields(target, data).forEach((field) => {
      const raw = record?.[field.key];
      next[field.key] = Array.isArray(raw) ? raw.join(', ') : raw === undefined ? '' : String(raw);
    });
    setValues(next);
    setForm({
      entity: target,
      originalId: record ? String(record[primaryKeys[target]]) : undefined,
    });
  }

  function submitForm() {
    if (!form) return;
    const requiredMissing = fields.find((field) => field.required && !values[field.key]?.trim());
    if (requiredMissing) {
      Alert.alert('Campo obrigatorio', `Preencha: ${requiredMissing.label}`);
      return;
    }
    const validation = validateRecord(form.entity, values, data, form.originalId);
    if (validation) {
      Alert.alert('Dados invalidos', validation);
      return;
    }

    const record = parseRecord(form.entity, values);
    const key = primaryKeys[form.entity];
    const id = String(record[key]);
    setData((current) => {
      const list = current[form.entity] as unknown as Record<string, unknown>[];
      const updated = form.originalId
        ? list.map((item) => String(item[key]) === form.originalId ? record : item)
        : [...list, record];
      return { ...current, [form.entity]: updated } as AppData;
    });
    setForm(null);
  }

  function removeRecord(target: EntityKey, record: Record<string, unknown>) {
    const key = primaryKeys[target];
    const id = String(record[key]);
    const blockedBy = target === 'funcionarios' ? null : deleteBlockReason(target, id, data);
    if (blockedBy) {
      Alert.alert('Exclusao bloqueada', blockedBy);
      return;
    }
    setData((current) => {
      if (target === 'funcionarios') {
        return {
          ...current,
          funcionarios: current.funcionarios
            .filter((item) => item.matricula !== id)
            .map((item) => item.gerenteMatricula === id
              ? { ...item, gerenteMatricula: undefined }
              : item),
          dependentes: current.dependentes.filter((item) => item.funcionarioMatricula !== id),
          progressoes: current.progressoes.filter((item) => item.funcionarioMatricula !== id),
          participacoes: current.participacoes.filter((item) => item.funcionarioMatricula !== id),
          testes: current.testes.filter((item) => item.funcionarioMatricula !== id),
        };
      }
      return {
        ...current,
        [target]: (current[target] as unknown as Record<string, unknown>[]).filter(
          (item) => String(item[key]) !== id,
        ),
      } as AppData;
    });
  }

  if (!loaded) {
    return <View style={styles.loading}><ActivityIndicator color="#f0c35b" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>FABRICA</Text>
        <Text style={styles.title}>Sistema para Fabrica de Software</Text>
        <Text style={styles.subtitle}>Projeto da disciplina de React Native.</Text>
      </View>

      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((item) => (
            <Pressable key={item} onPress={() => setTab(item)}
              style={[styles.tabButton, tab === item && styles.tabButtonActive]}>
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'Painel' && (
          <>
            <View style={styles.metricGrid}>
              <Metric label="Setores" value={String(data.setores.length)} />
              <Metric label="Funcionarios" value={String(data.funcionarios.length)} />
              <Metric label="Projetos" value={String(data.projetos.length)} />
              <Metric label="Orcamento" value={currency.format(totalOrcamento)} />
            </View>
            <Section title="Resumo do sistema">
              <InfoRow label="Projetos financeiros" value={`${projetosFinanceiros.length} com patrocinador`} />
              <InfoRow label="Testes com falha grave" value={`${testesGraves.length} encontrados`} />
              <InfoRow label="Efetivos cadastrados" value={`${data.funcionarios.filter((f) => f.tipo === 'efetivo').length}`} />
              <InfoRow label="Dependentes de efetivos" value={`${data.dependentes.length}`} />
              <InfoRow label="Cartoes unicos" value={`${data.progressoes.length}`} />
              <InfoRow label="Participacoes em projetos" value={`${data.participacoes.length}`} />
            </Section>
            <Section title="Funcionarios por setor">
              {data.setores.map((setor) => (
                <InfoRow key={setor.id} label={`${setor.sigla} - ${setor.descricao}`}
                  value={`${data.funcionarios.filter((f) => f.setorId === setor.id).length} funcionario(s)`} />
              ))}
            </Section>
          </>
        )}

        {tab === 'Cadastros' && (
          <>
            <View style={styles.entityPicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {entityKeys.map((item) => (
                  <Pressable key={item} onPress={() => setEntity(item)}
                    style={[styles.entityButton, entity === item && styles.entityButtonActive]}>
                    <Text style={[styles.entityText, entity === item && styles.entityTextActive]}>
                      {entityLabels[item]} ({data[item].length})
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{entityLabels[entity]}</Text>
              <Pressable onPress={() => openForm(entity)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>+ Novo</Text>
              </Pressable>
            </View>
            {(data[entity] as unknown as Record<string, unknown>[]).map((record) => (
              <RecordCard key={String(record[primaryKeys[entity]])} entity={entity} record={record} data={data}
                onEdit={() => openForm(entity, record)} onDelete={() => removeRecord(entity, record)} />
            ))}
            {data[entity].length === 0 && <Empty />}
          </>
        )}

        {tab === 'Projetos' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projetos e equipes</Text>
              <Pressable onPress={() => openForm('projetos')} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>+ Projeto</Text>
              </Pressable>
            </View>
            {data.projetos.map((projeto) => {
              const equipe = data.participacoes.filter((item) => item.projetoId === projeto.id);
              return (
                <Card key={projeto.id}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{projeto.descricao}</Text>
                    <Badge text={projeto.tipo} />
                  </View>
                  <Text style={styles.cardText}>ID: {projeto.id} | Inicio: {projeto.inicio}</Text>
                  <Text style={styles.cardText}>Orcamento: {currency.format(projeto.orcamento)}</Text>
                  <Text style={styles.cardText}>
                    {projeto.tipo === 'Financeiro'
                      ? `Patrocinador: ${projeto.patrocinador}`
                      : `Verba limite: ${currency.format(projeto.verbaLimite ?? 0)}`}
                  </Text>
                  <Text style={styles.cardSubtitle}>Equipe e periodo de participacao</Text>
                  {equipe.map((participacao) => (
                    <Text key={participacao.id} style={styles.cardText}>
                      {nameOf(data, 'funcionario', participacao.funcionarioMatricula)}: {participacao.entrada} ate {participacao.saida || 'atualmente'}
                    </Text>
                  ))}
                  {equipe.length === 0 && <Text style={styles.cardText}>Sem participantes.</Text>}
                </Card>
              );
            })}
          </>
        )}

        {tab === 'Testes' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Testes financeiros e ocorrencias</Text>
              <Pressable onPress={() => openForm('testes')} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>+ Teste</Text>
              </Pressable>
            </View>
            {data.testes.map((teste) => (
              <Card key={teste.id}>
                <Text style={styles.cardTitle}>{nameOf(data, 'projeto', teste.projetoId)}</Text>
                <Text style={styles.cardText}>Teste: {teste.id} | Data: {teste.data}</Text>
                <Text style={styles.cardText}>Testador: {nameOf(data, 'funcionario', teste.funcionarioMatricula)}</Text>
                <Text style={styles.cardSubtitle}>Ocorrencias registradas</Text>
                {teste.falhaCodigos.map((codigo) => {
                  const falha = data.falhas.find((item) => item.codigo === codigo);
                  return <Text key={codigo} style={styles.cardText}>{codigo} - {falha?.descricao} ({falha?.nivel})</Text>;
                })}
                {teste.falhaCodigos.length === 0 && <Text style={styles.cardText}>Nenhuma falha registrada.</Text>}
              </Card>
            ))}
          </>
        )}

        {tab === 'Modelo' && (
          <>
            <Section title="Relacionamentos do sistema">
              <Relation from="SETOR" cardinality="1 : N" to="FUNCIONARIO" note="Cada funcionario pertence a um setor." />
              <Relation from="CARGO" cardinality="1 : N" to="FUNCIONARIO" note="O salario e definido pelo cargo." />
              <Relation from="FUNCIONARIO" cardinality="N : N" to="PROJETO" note="Participacao guarda entrada e saida." />
              <Relation from="FUNCIONARIO" cardinality="1 : N" to="FUNCIONARIO" note="Autorrelacionamento de gerencia." />
              <Relation from="FUNCIONARIO EFETIVO" cardinality="1 : N" to="DEPENDENTE" note="Dependente e entidade fraca." />
              <Relation from="FUNCIONARIO" cardinality="1 : 1" to="CARTAO" note="Cartao de progressao e unico." />
              <Relation from="FUNCIONARIO" cardinality="N : N" to="PROJETO FINANCEIRO" note="Teste pode registrar varias falhas." />
            </Section>
            <Section title="Tipos cadastrados">
              <Card>
                <Text style={styles.cardTitle}>PROJETO</Text>
                <Text style={styles.cardText}>Cada projeto possui somente um tipo:</Text>
                <Text style={styles.cardText}>Financeiro possui patrocinador.</Text>
                <Text style={styles.cardText}>Administrativo possui verba limite.</Text>
              </Card>
              <Card>
                <Text style={styles.cardTitle}>FUNCIONARIO</Text>
                <Text style={styles.cardText}>Efetivo pode possuir dependentes; contratado nao pode.</Text>
              </Card>
            </Section>
          </>
        )}
      </ScrollView>

      <Modal visible={Boolean(form)} animationType="slide" onRequestClose={() => setForm(null)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>{form?.originalId ? 'EDITAR' : 'NOVO CADASTRO'}</Text>
              <Text style={styles.modalTitle}>{form ? entityLabels[form.entity] : ''}</Text>
            </View>
            <Pressable onPress={() => setForm(null)} style={styles.closeButton}><Text style={styles.closeText}>Fechar</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            {fields.map((field) => (
              <FormField key={field.key} field={field} value={values[field.key] ?? ''}
                onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
            ))}
            <Pressable onPress={submitForm} style={styles.saveButton}><Text style={styles.saveButtonText}>Salvar cadastro</Text></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getFields(entity: EntityKey, data: AppData): Field[] {
  const options = (items: { label: string; value: string }[]) => items;
  const funcionarios = options(data.funcionarios.map((f) => ({ label: `${f.matricula} - ${f.nome}`, value: f.matricula })));
  const efetivos = options(data.funcionarios.filter((f) => f.tipo === 'efetivo').map((f) => ({ label: `${f.matricula} - ${f.nome}`, value: f.matricula })));
  const projetos = options(data.projetos.map((p) => ({ label: `${p.id} - ${p.descricao}`, value: p.id })));
  const financeiros = options(data.projetos.filter((p) => p.tipo === 'Financeiro').map((p) => ({ label: `${p.id} - ${p.descricao}`, value: p.id })));
  const common: Record<EntityKey, Field[]> = {
    setores: [
      { key: 'id', label: 'Identificacao', required: true, placeholder: 'SET-04' },
      { key: 'descricao', label: 'Descricao', required: true },
      { key: 'sigla', label: 'Sigla', required: true },
    ],
    cargos: [
      { key: 'codigo', label: 'Codigo do cargo', required: true },
      { key: 'descricao', label: 'Descricao', required: true },
      { key: 'salario', label: 'Salario', required: true, numeric: true },
      { key: 'ultimoAjuste', label: 'Data do ultimo ajuste', required: true, placeholder: 'AAAA-MM-DD' },
    ],
    funcionarios: [
      { key: 'matricula', label: 'Matricula', required: true },
      { key: 'nome', label: 'Nome', required: true },
      { key: 'sexo', label: 'Sexo (opcional)', options: [{ label: 'Feminino', value: 'F' }, { label: 'Masculino', value: 'M' }, { label: 'Nao informar', value: '' }] },
      { key: 'endereco', label: 'Endereco', required: true },
      { key: 'telefones', label: 'Telefones separados por virgula', required: true },
      { key: 'diaNascimento', label: 'Dia de nascimento', required: true, numeric: true },
      { key: 'mesNascimento', label: 'Mes de nascimento', required: true, numeric: true },
      { key: 'anoNascimento', label: 'Ano de nascimento', required: true, numeric: true },
      { key: 'setorId', label: 'Setor', required: true, options: data.setores.map((s) => ({ label: `${s.sigla} - ${s.descricao}`, value: s.id })) },
      { key: 'cargoCodigo', label: 'Cargo', required: true, options: data.cargos.map((c) => ({ label: c.descricao, value: c.codigo })) },
      { key: 'gerenteMatricula', label: 'Gerente (opcional)', options: [{ label: 'Nao possui', value: '' }, ...funcionarios] },
      { key: 'tipo', label: 'Tipo de funcionario', required: true, options: [{ label: 'Efetivo', value: 'efetivo' }, { label: 'Contratado', value: 'contratado' }] },
    ],
    projetos: [
      { key: 'id', label: 'Identificacao', required: true },
      { key: 'descricao', label: 'Descricao', required: true },
      { key: 'tipo', label: 'Tipo', required: true, options: [{ label: 'Financeiro', value: 'Financeiro' }, { label: 'Administrativo', value: 'Administrativo' }] },
      { key: 'orcamento', label: 'Orcamento', required: true, numeric: true },
      { key: 'inicio', label: 'Data de inicio', required: true, placeholder: 'AAAA-MM-DD' },
      { key: 'patrocinador', label: 'Patrocinador (projeto financeiro)' },
      { key: 'verbaLimite', label: 'Verba limite (projeto administrativo)', numeric: true },
    ],
    participacoes: [
      { key: 'id', label: 'Identificacao', required: true },
      { key: 'projetoId', label: 'Projeto', required: true, options: projetos },
      { key: 'funcionarioMatricula', label: 'Funcionario', required: true, options: funcionarios },
      { key: 'entrada', label: 'Data de entrada', required: true, placeholder: 'AAAA-MM-DD' },
      { key: 'saida', label: 'Data de saida (opcional)', placeholder: 'AAAA-MM-DD' },
    ],
    falhas: [
      { key: 'codigo', label: 'Codigo', required: true },
      { key: 'descricao', label: 'Descricao', required: true },
      { key: 'nivel', label: 'Nivel', required: true, options: [{ label: 'Baixo', value: 'baixo' }, { label: 'Medio', value: 'medio' }, { label: 'Grave', value: 'grave' }] },
    ],
    testes: [
      { key: 'id', label: 'Identificacao', required: true },
      { key: 'projetoId', label: 'Projeto financeiro', required: true, options: financeiros },
      { key: 'funcionarioMatricula', label: 'Funcionario testador', required: true, options: funcionarios },
      { key: 'data', label: 'Data do teste', required: true, placeholder: 'AAAA-MM-DD' },
      { key: 'falhaCodigos', label: 'Codigos das falhas separados por virgula', placeholder: 'FL-01, FL-02' },
    ],
    dependentes: [
      { key: 'id', label: 'Identificacao', required: true },
      { key: 'funcionarioMatricula', label: 'Funcionario efetivo', required: true, options: efetivos },
      { key: 'nome', label: 'Nome', required: true },
      { key: 'nascimento', label: 'Data de nascimento', required: true, placeholder: 'AAAA-MM-DD' },
      { key: 'parentesco', label: 'Grau de parentesco', required: true },
    ],
    progressoes: [
      { key: 'codigo', label: 'Codigo do cartao', required: true },
      { key: 'funcionarioMatricula', label: 'Funcionario', required: true, options: funcionarios },
      { key: 'ultimaProgressao', label: 'Data da ultima progressao', required: true, placeholder: 'AAAA-MM-DD' },
      { key: 'categoria', label: 'Categoria', required: true, options: [{ label: 'Junior', value: 'Junior' }, { label: 'Senior', value: 'Senior' }] },
    ],
  };
  return common[entity];
}

function parseRecord(entity: EntityKey, values: FormValues): Record<string, unknown> {
  const record: Record<string, unknown> = { ...values };
  const numbers: Record<EntityKey, string[]> = {
    setores: [], cargos: ['salario'], funcionarios: ['diaNascimento', 'mesNascimento', 'anoNascimento'],
    projetos: ['orcamento', 'verbaLimite'], participacoes: [], falhas: [], testes: [], dependentes: [], progressoes: [],
  };
  numbers[entity].forEach((key) => { record[key] = values[key] ? Number(values[key].replace(',', '.')) : undefined; });
  if (entity === 'funcionarios') record.telefones = splitList(values.telefones);
  if (entity === 'testes') record.falhaCodigos = splitList(values.falhaCodigos);
  Object.keys(record).forEach((key) => { if (record[key] === '') record[key] = undefined; });
  return record;
}

function validateRecord(entity: EntityKey, values: FormValues, data: AppData, originalId?: string): string | null {
  const id = values[primaryKeys[entity]];
  const duplicate = (data[entity] as unknown as Record<string, unknown>[]).some(
    (item) => String(item[primaryKeys[entity]]) === id && id !== originalId,
  );
  if (duplicate) return `Ja existe um registro com a identificacao ${id}.`;
  if (entity === 'projetos' && values.tipo === 'Financeiro' && !values.patrocinador) return 'Projeto financeiro precisa de patrocinador.';
  if (entity === 'projetos' && values.tipo === 'Administrativo' && !values.verbaLimite) return 'Projeto administrativo precisa de verba limite.';
  if (entity === 'funcionarios' && values.gerenteMatricula === values.matricula) return 'Um funcionario nao pode gerenciar a si mesmo.';
  if (entity === 'progressoes') {
    const existing = data.progressoes.find((item) => item.funcionarioMatricula === values.funcionarioMatricula && item.codigo !== originalId);
    if (existing) return 'Este funcionario ja possui um cartao de progressao.';
  }
  if (entity === 'testes') {
    const invalid = splitList(values.falhaCodigos).find((codigo) => !data.falhas.some((falha) => falha.codigo === codigo));
    if (invalid) return `O tipo de falha ${invalid} nao esta cadastrado.`;
  }
  return null;
}

function deleteBlockReason(entity: EntityKey, id: string, data: AppData): string | null {
  if (entity === 'setores' && data.funcionarios.some((item) => item.setorId === id)) {
    return 'Este setor possui funcionarios vinculados.';
  }
  if (entity === 'cargos' && data.funcionarios.some((item) => item.cargoCodigo === id)) {
    return 'Este cargo esta ocupado por funcionarios.';
  }
  if (entity === 'funcionarios') {
    if (data.funcionarios.some((item) => item.gerenteMatricula === id)) return 'Este funcionario gerencia outros funcionarios.';
    if (data.dependentes.some((item) => item.funcionarioMatricula === id)) return 'Este funcionario possui dependentes.';
    if (data.progressoes.some((item) => item.funcionarioMatricula === id)) return 'Este funcionario possui cartao de progressao.';
    if (data.participacoes.some((item) => item.funcionarioMatricula === id)) return 'Este funcionario participa de projetos.';
    if (data.testes.some((item) => item.funcionarioMatricula === id)) return 'Este funcionario possui testes registrados.';
  }
  if (entity === 'projetos') {
    if (data.participacoes.some((item) => item.projetoId === id)) return 'Este projeto possui participantes.';
    if (data.testes.some((item) => item.projetoId === id)) return 'Este projeto possui testes registrados.';
  }
  if (entity === 'falhas' && data.testes.some((item) => item.falhaCodigos.includes(id))) {
    return 'Este tipo de falha aparece em testes registrados.';
  }
  return null;
}

function splitList(value = '') {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function nameOf(data: AppData, type: 'funcionario' | 'projeto', id: string) {
  return type === 'funcionario'
    ? data.funcionarios.find((item) => item.matricula === id)?.nome ?? id
    : data.projetos.find((item) => item.id === id)?.descricao ?? id;
}

function RecordCard({ entity, record, data, onEdit, onDelete }: {
  entity: EntityKey; record: Record<string, unknown>; data: AppData; onEdit: () => void; onDelete: () => void;
}) {
  const lines: string[] = [];
  let title = String(record[primaryKeys[entity]]);
  if (entity === 'setores') { title = `${record.sigla} - ${record.descricao}`; lines.push(`Identificacao: ${record.id}`); }
  if (entity === 'cargos') { title = String(record.descricao); lines.push(`Codigo: ${record.codigo}`, `Salario: ${currency.format(Number(record.salario))}`, `Ultimo ajuste: ${record.ultimoAjuste}`); }
  if (entity === 'funcionarios') {
    title = String(record.nome);
    lines.push(`Matricula: ${record.matricula} | Tipo: ${record.tipo}`, `Sexo: ${record.sexo ?? 'Nao informado'}`, `Endereco: ${record.endereco}`, `Telefones: ${(record.telefones as string[]).join(', ')}`, `Nascimento: ${record.diaNascimento}/${record.mesNascimento}/${record.anoNascimento}`, `Setor: ${record.setorId} | Cargo: ${record.cargoCodigo}`, `Gerente: ${record.gerenteMatricula ? nameOf(data, 'funcionario', String(record.gerenteMatricula)) : 'Nao possui'}`);
  }
  if (entity === 'projetos') { title = String(record.descricao); lines.push(`ID: ${record.id} | Tipo: ${record.tipo}`, `Orcamento: ${currency.format(Number(record.orcamento))}`, `Inicio: ${record.inicio}`, record.tipo === 'Financeiro' ? `Patrocinador: ${record.patrocinador}` : `Verba limite: ${currency.format(Number(record.verbaLimite))}`); }
  if (entity === 'participacoes') { title = `${nameOf(data, 'funcionario', String(record.funcionarioMatricula))} em ${nameOf(data, 'projeto', String(record.projetoId))}`; lines.push(`Entrada: ${record.entrada}`, `Saida: ${record.saida ?? 'Atualmente'}`); }
  if (entity === 'falhas') { title = `${record.codigo} - ${record.descricao}`; lines.push(`Nivel: ${record.nivel}`); }
  if (entity === 'testes') { title = `${record.id} - ${nameOf(data, 'projeto', String(record.projetoId))}`; lines.push(`Testador: ${nameOf(data, 'funcionario', String(record.funcionarioMatricula))}`, `Data: ${record.data}`, `Falhas: ${(record.falhaCodigos as string[]).join(', ') || 'Nenhuma'}`); }
  if (entity === 'dependentes') { title = String(record.nome); lines.push(`Responsavel: ${nameOf(data, 'funcionario', String(record.funcionarioMatricula))}`, `Nascimento: ${record.nascimento}`, `Parentesco: ${record.parentesco}`); }
  if (entity === 'progressoes') { title = `${record.codigo} - ${nameOf(data, 'funcionario', String(record.funcionarioMatricula))}`; lines.push(`Ultima progressao: ${record.ultimaProgressao}`, `Categoria: ${record.categoria}`); }
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      {lines.map((line) => <Text key={line} style={styles.cardText}>{line}</Text>)}
      <View style={styles.actions}>
        <Pressable onPress={onEdit} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Editar</Text></Pressable>
        <Pressable onPress={onDelete} style={styles.deleteButton}><Text style={styles.deleteButtonText}>Excluir</Text></Pressable>
      </View>
    </Card>
  );
}

function FormField({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
      {field.options ? (
        <View style={styles.choiceGrid}>
          {field.options.map((option) => (
            <Pressable key={`${field.key}-${option.value || 'empty'}`} onPress={() => onChange(option.value)}
              style={[styles.choice, value === option.value && styles.choiceActive]}>
              <Text style={[styles.choiceText, value === option.value && styles.choiceTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <TextInput value={value} onChangeText={onChange} placeholder={field.placeholder}
          keyboardType={field.numeric ? 'numeric' : 'default'} style={styles.input} />
      )}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}
function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Card({ children }: { children: React.ReactNode }) { return <View style={styles.card}>{children}</View>; }
function Badge({ text }: { text: string }) { return <View style={styles.badge}><Text style={styles.badgeText}>{text}</Text></View>; }
function Empty() { return <View style={styles.empty}><Text style={styles.emptyText}>Nenhum registro cadastrado.</Text></View>; }
function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}
function Relation({ from, cardinality, to, note }: { from: string; cardinality: string; to: string; note: string }) {
  return <Card><View style={styles.relationLine}><Badge text={from} /><Text style={styles.cardSubtitle}>{cardinality}</Text><Badge text={to} /></View><Text style={styles.cardText}>{note}</Text></Card>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eef2f3' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#15363a' },
  header: { backgroundColor: '#15363a', paddingHorizontal: 18, paddingBottom: 18, paddingTop: 24 },
  brand: { color: '#f0c35b', fontSize: 15, fontWeight: '800' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 29, marginTop: 6 },
  subtitle: { color: '#dce7e7', fontSize: 13, lineHeight: 18, marginTop: 7 },
  tabs: { backgroundColor: '#15363a', paddingBottom: 11, paddingHorizontal: 12 },
  tabButton: { borderColor: '#496569', borderRadius: 7, borderWidth: 1, marginRight: 7, minHeight: 38, paddingHorizontal: 13, justifyContent: 'center' },
  tabButtonActive: { backgroundColor: '#f0c35b', borderColor: '#f0c35b' },
  tabText: { color: '#dce7e7', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#1b2528' },
  content: { padding: 14, paddingBottom: 36 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { backgroundColor: '#fff', borderColor: '#d8e0e1', borderRadius: 7, borderWidth: 1, flexBasis: '47%', flexGrow: 1, minHeight: 88, padding: 13, justifyContent: 'space-between' },
  metricValue: { color: '#15363a', fontSize: 21, fontWeight: '800' },
  metricLabel: { color: '#5a6b70', fontSize: 13, fontWeight: '700' },
  section: { marginTop: 18 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 12 },
  sectionTitle: { color: '#1f3134', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  entityPicker: { marginBottom: 4 },
  entityButton: { backgroundColor: '#fff', borderColor: '#ccd7d9', borderWidth: 1, borderRadius: 6, marginRight: 7, paddingHorizontal: 12, paddingVertical: 10 },
  entityButtonActive: { backgroundColor: '#15363a', borderColor: '#15363a' },
  entityText: { color: '#526367', fontSize: 12, fontWeight: '700' },
  entityTextActive: { color: '#fff' },
  primaryButton: { backgroundColor: '#15363a', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderColor: '#d8e0e1', borderRadius: 7, borderWidth: 1, marginBottom: 9, padding: 13 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  cardTitle: { color: '#1f3134', flex: 1, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  cardSubtitle: { color: '#15363a', fontSize: 13, fontWeight: '800', marginBottom: 4, marginTop: 9 },
  cardText: { color: '#526367', fontSize: 13, lineHeight: 19 },
  badge: { backgroundColor: '#e8eeee', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: '#15363a', fontSize: 11, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryButton: { borderColor: '#6d8588', borderWidth: 1, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8 },
  secondaryButtonText: { color: '#284548', fontSize: 12, fontWeight: '800' },
  deleteButton: { borderColor: '#bc6b67', borderWidth: 1, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8 },
  deleteButtonText: { color: '#9c3935', fontSize: 12, fontWeight: '800' },
  infoRow: { alignItems: 'flex-start', backgroundColor: '#fff', borderColor: '#d8e0e1', borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginBottom: 7, padding: 12 },
  infoLabel: { color: '#1f3134', flex: 1, fontSize: 13, fontWeight: '700' },
  infoValue: { color: '#5a6b70', flex: 1, fontSize: 13, textAlign: 'right' },
  empty: { alignItems: 'center', padding: 30 },
  emptyText: { color: '#6a7b7f', fontSize: 14 },
  relationLine: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 8 },
  modalSafe: { flex: 1, backgroundColor: '#f3f6f6' },
  modalHeader: { alignItems: 'center', backgroundColor: '#15363a', flexDirection: 'row', justifyContent: 'space-between', padding: 18 },
  modalEyebrow: { color: '#f0c35b', fontSize: 11, fontWeight: '800' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 3 },
  closeButton: { borderColor: '#789093', borderWidth: 1, borderRadius: 5, paddingHorizontal: 11, paddingVertical: 8 },
  closeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  formContent: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 15 },
  fieldLabel: { color: '#263d40', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderColor: '#bdcbcd', borderRadius: 6, borderWidth: 1, color: '#1f3134', fontSize: 14, minHeight: 44, paddingHorizontal: 11, paddingVertical: 10 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { backgroundColor: '#fff', borderColor: '#bdcbcd', borderRadius: 5, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  choiceActive: { backgroundColor: '#f0c35b', borderColor: '#d4a62e' },
  choiceText: { color: '#53676a', fontSize: 12, fontWeight: '700' },
  choiceTextActive: { color: '#1f3134' },
  saveButton: { alignItems: 'center', backgroundColor: '#15363a', borderRadius: 6, marginTop: 8, padding: 14 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
