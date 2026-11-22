import type { Jogador } from "../interfaces/Jogador";

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

  return jogadores
    .map((jogador, indice) => ({
      ...jogador,
      id: jogador.id ?? `jogador-${indice + 1}`,
      avatar: jogador.avatar ?? indice % 4,
      criado_em: jogador.criado_em ?? new Date().toISOString(),
    }))
    .sort((a, b) => a.tempo - b.tempo);
}

export async function salvarJogadorNaClassificacao(jogador: Jogador): Promise<Jogador[]> {
  const jogadores = await buscarClassificacao();
  const jogadoresAtualizados = [
    ...jogadores.filter((item) => item.id !== jogador.id),
    jogador,
  ].sort((a, b) => a.tempo - b.tempo);

  await alterarDadosMyJson<Jogador[]>(jogadoresAtualizados);

  return jogadoresAtualizados;
}
