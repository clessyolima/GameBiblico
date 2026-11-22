import type { Jogador } from "../interfaces/Jogador";
import livros from "../utils/livros";

const API_URL = "https://api.myjson.online/v2";

interface MyJsonRecord<T> {
  id?: string;
  version?: number;
  data: T;
}

export interface ClassificacaoData {
  jogadores: Jogador[];
}

interface MyJsonColecao {
  records: Array<MyJsonRecord<unknown>>;
}

function obterConfiguracao() {
  return {
    collectionId: import.meta.env.VITE_MYJSON_COLLECTION_ID as string | undefined,
    recordId: import.meta.env.VITE_MYJSON_RECORD_ID as string | undefined,
    accessToken: import.meta.env.VITE_MYJSON_ACCESS_TOKEN as string | undefined,
  };
}

function criarCabecalho(comConteudo = false) {
  const { accessToken } = obterConfiguracao();
  const cabecalho = new Headers();

  if (comConteudo) {
    cabecalho.set("Content-Type", "application/x-www-form-urlencoded");
  }

  if (accessToken) {
    cabecalho.set("x-collection-access-token", accessToken);
  }

  return cabecalho;
}

function ordenarClassificacao(jogadores: Jogador[]) {
  return jogadores.sort((a, b) => {
    const aCompleto = a.acertos >= livros.length;
    const bCompleto = b.acertos >= livros.length;

    if (aCompleto !== bCompleto) return aCompleto ? -1 : 1;
    if (aCompleto) return a.tempo - b.tempo;
    if (a.acertos !== b.acertos) return b.acertos - a.acertos;
    return a.tempo - b.tempo;
  });
}

async function lerResposta(resposta: Response) {
  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status} ao comunicar com o MyJSON`;

    try {
      const erro = await resposta.json() as { message?: string };
      if (erro.message) mensagem = erro.message;
    } catch {
      // Mantém a mensagem padrão quando o serviço não retorna JSON.
    }

    throw new Error(mensagem);
  }

  return resposta.json() as Promise<MyJsonRecord<unknown>>;
}

export async function buscarDadosMyJson<T>(): Promise<MyJsonRecord<T>> {
  const { collectionId, recordId } = obterConfiguracao();

  if (!collectionId) {
    throw new Error("VITE_MYJSON_COLLECTION_ID não configurado.");
  }

  const resposta = await fetch(`${API_URL}/collections/${encodeURIComponent(collectionId)}/records`, {
    method: "GET",
    headers: criarCabecalho(),
  });

  const colecao = await lerResposta(resposta) as unknown as MyJsonColecao;
  const registro = recordId
    ? colecao.records.find((item) => item.id === recordId)
    : colecao.records[0];

  if (!registro) {
    throw new Error("Registro da classificação não encontrado na coleção.");
  }

  return registro as MyJsonRecord<T>;
}

export async function alterarDadosMyJson<T>(dados: T): Promise<MyJsonRecord<T>> {
  const { collectionId, recordId } = obterConfiguracao();

  if (!collectionId) {
    throw new Error("VITE_MYJSON_COLLECTION_ID não configurado.");
  }

  if (!recordId) {
    throw new Error("VITE_MYJSON_RECORD_ID não configurado.");
  }

  const resposta = await fetch(`${API_URL}/records/${encodeURIComponent(recordId)}`, {
    method: "PUT",
    headers: criarCabecalho(true),
    body: new URLSearchParams({
      collectionId,
      data: JSON.stringify(dados),
      metadata: "true",
    }),
  });

  return lerResposta(resposta) as Promise<MyJsonRecord<T>>;
}

export async function buscarClassificacao(): Promise<Jogador[]> {
  const registro = await buscarDadosMyJson<ClassificacaoData | Jogador[]>();
  const dados = registro.data;
  const jogadores = Array.isArray(dados)
    ? dados
    : dados.jogadores;

  const jogadoresNormalizados = jogadores.map((jogador, indice) => ({
    ...jogador,
    id: jogador.id ?? `jogador-${indice + 1}`,
    acertos: jogador.acertos ?? 0,
    avatar: jogador.avatar ?? indice % 4,
    criado_em: jogador.criado_em ?? new Date().toISOString(),
  }));

  return ordenarClassificacao(jogadoresNormalizados);
}

export function partidaAtualMelhorQue(atual: Jogador, gravada: Jogador): boolean {
  const atualCompleta = atual.acertos >= livros.length;
  const gravadaCompleta = gravada.acertos >= livros.length;

  if (atualCompleta !== gravadaCompleta) return atualCompleta;
  if (atualCompleta) return atual.tempo < gravada.tempo;
  if (atual.acertos !== gravada.acertos) return atual.acertos > gravada.acertos;
  return atual.tempo < gravada.tempo;
}

export async function salvarJogadorNaClassificacao(jogador: Jogador): Promise<Jogador[]> {
  const jogadores = await buscarClassificacao();
  const jogadorGravado = jogadores.find((item) => item.id === jogador.id);

  if (jogadorGravado && !partidaAtualMelhorQue(jogador, jogadorGravado)) {
    return jogadores;
  }

  const jogadoresAtualizados = ordenarClassificacao([
    ...jogadores.filter((item) => item.id !== jogador.id),
    jogador,
  ]);

  await alterarDadosMyJson<Jogador[]>(jogadoresAtualizados);

  return jogadoresAtualizados;
}
