import styles from "./Podio.module.scss";

import Avatar from "../Avatar";
import { avatares } from "../../utils/avatares";
import type { Jogador } from "../../interfaces/Jogador";

interface PodioProps {
  estilo?: string;
  tamanhoAvatar?: number;
  jogadores?: Jogador[];
}

export default function Podio({ estilo, tamanhoAvatar, jogadores = [] }: PodioProps) {
  const ordemPodio = [1, 0, 2];

  return (
    <section className={`${styles.secaoPodio} ${estilo}`}>
      {ordemPodio.map((indiceJogador) => {
        const jogador = jogadores[indiceJogador];
        if (!jogador) return null;
        const posicao = indiceJogador + 1;

        return (
          <div key={jogador.id} className={`${styles.top3} ${styles[`posicao${posicao}`]}`}>
            <div className={styles.informacoesJogador}>
              <Avatar src={avatares[jogador.avatar]} alt="Avatar" tamanho={tamanhoAvatar} />

              <h3 className={styles.nomeJogador}>{jogador.nome}</h3>

              <p className={styles.idJogador}>#{jogador.id}</p>
            </div>

            <div className={styles.informacoesColocacao}>
              <div className={styles.conteudoColocacao}>
                <div className={styles.jogadorColocacao}>
                  <span className={styles.posicaoColocacao}>{posicao}º</span>
                </div>

                <span className={styles.tempoColocacao}>{jogador.tempo}seg</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
