import { Gamepad2Icon, Home, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Final.module.scss";

import Cabecalho from "../../components/Header";
import Podio from "../../components/Podio";
import DemaisJogadores from "../../components/DemaisJogadores";
import type { Jogador } from "../../interfaces/Jogador";
import { buscarClassificacao } from "../../services/myJson";
import { obterOuCriarJogadorLocal } from "../../utils/jogadorLocal";

export default function Final() {
  const navigate = useNavigate();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const jogadorLocal = obterOuCriarJogadorLocal();
  const colocacao = jogadores.findIndex((jogador) => jogador.id === jogadorLocal.id) + 1;
  const textoColocacao = colocacao > 0 ? colocacao : "-";

  useEffect(() => {
    let ativo = true;

    buscarClassificacao()
      .then((jogadoresDaApi) => {
        if (ativo) setJogadores(jogadoresDaApi);
      })
      .catch((erro: unknown) => {
        console.error("Não foi possível carregar o resultado:", erro);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className={styles.escopo}>
      <Cabecalho tituloPagina="Resumo" className={styles.secaoCabecalho} />

      <section className={styles.secaoResultadoDaPartida}>
        <p className={styles.fraseResultadoDaPartida}>
          Incrível você ficou em
          <span className={styles.colocacaoDaPartida}>{textoColocacao}º</span>
          lugar!
        </p>
      </section>

      <section className={styles.secaoCompartilharResultado}>
        <button className={styles.botaoCompartilharResultado}>
          <Share2 size={16} strokeWidth={2.5} />
          Compartilhe
        </button>
      </section>

      {jogadores.length > 0
        ? <>
            <Podio jogadores={jogadores.slice(0, 3)} />
            {jogadores.length > 3
              ? <DemaisJogadores estilo={styles.secaoListaDeJogadores} resumoPartida={true} jogadores={jogadores} />
              : null
            }
          </>
        : null
      }

      <section className={styles.secaoBotoesDeAcao}>
        <button
          onClick={() => navigate("/")}
          className={styles.botaoVoltarAoInicio}
        >
          <Home size={16} strokeWidth={2.5} />
          Voltar ao início
        </button>

        <button
          onClick={() => navigate("/jogatina")}
          className={styles.botaoJogarNovamente}
        >
          <Gamepad2Icon size={16} strokeWidth={2.5} />
          Jogar novamente
        </button>
      </section>
    </main>
  )
}