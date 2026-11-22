import styles from "./Ranking.module.scss";
import { useEffect, useState } from "react";

import Cabecalho from "../../components/Header";
import Podio from "../../components/Podio";
import DemaisJogadores from "../../components/DemaisJogadores";
import type { Jogador } from "../../interfaces/Jogador";
import { buscarClassificacao } from "../../services/myJson";

export default function Ranking() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    buscarClassificacao()
      .then((jogadoresDaApi) => {
        if (ativo) {
          setJogadores(jogadoresDaApi);
          setErro("");
        }
      })
      .catch((erro: unknown) => {
        if (ativo) setErro(erro instanceof Error ? erro.message : "Não foi possível carregar a classificação.");
        console.error("Não foi possível carregar a classificação:", erro);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className={styles.escopo}>
      <Cabecalho tituloPagina="Ranking" className={styles.secaoCabecalho} />
      {carregando ? <p>Carregando ranking...</p> : null}
      {erro ? <p>{erro}</p> : null}
      <Podio estilo={styles.secaoPodio} tamanhoAvatar={70} jogadores={jogadores} />
      <DemaisJogadores jogadores={jogadores} />
    </main>
  );
}
