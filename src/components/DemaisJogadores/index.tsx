import type { JSX } from "react";
import type { Jogador } from "../../interfaces/Jogador";

import styles from "./DemaisJogadores.module.scss";
import Avatar from "../Avatar";
import { avatares } from "../../utils/avatares";
import livros from "../../utils/livros";

interface DemaisJogadoresPorps {
  estilo?: string;
  resumoPartida?: boolean;
  jogadores?: Jogador[];
}

export default function DemaisJogadores({ estilo, resumoPartida, jogadores = [] }: DemaisJogadoresPorps): JSX.Element {
  const resumo = resumoPartida ? "efeitoCascata" : "";
  const jogadoresCompletos = jogadores.filter((jogador) => jogador.acertos >= livros.length);
  const jogadoresIncompletos = jogadores.filter((jogador) => jogador.acertos < livros.length);
  const listaDemaisJogadores = [
    ...jogadoresCompletos.slice(3),
    ...jogadoresIncompletos,
  ];
  const demaisJogadores = resumoPartida
    ? listaDemaisJogadores.slice(0, 6)
    : listaDemaisJogadores;

  return (
    <section className={`${styles.secaoListaDeJogadores} ${estilo}`}>
      <ul className={`${styles.listaDemaisColocados} ${styles[resumo]}`}>{
        demaisJogadores.map((jogador: Jogador, index) => (
          <li key={jogador.id} className={styles.jogadorColocado}>
            <span className={styles.posicaoColocado}>{index + 4}</span>

            <Avatar src={avatares[jogador.avatar]} alt="Avatar" tamanho={50} />

            <div className={styles.informacoesJogadorColocado}>
              <p className={styles.nomeJogadorColocado}>{jogador.nome}</p>
              <p className={styles.idJogadorColocado}>#{jogador.id}</p>
            </div>

            <div className={styles.resultadoColocado}>
              <p className={styles.acertosColocado}>{jogador.acertos}/{livros.length} acertos</p>
              <p className={styles.tempoColocado}>{jogador.tempo}seg</p>
            </div>
          </li>
        ))
      }</ul>
    </section>
  )
}