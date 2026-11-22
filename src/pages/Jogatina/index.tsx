import { useCallback, useEffect, useRef, useState } from "react";
import { BookMarked, Pause, Timer, X } from "lucide-react";

import styles from "./Jogatina.module.scss";
import ModalBase from "../../components/ModalBase";

import livros from "../../utils/livros";
import type { Livro } from "../../interfaces/Livros";
import { useNavigate } from "react-router-dom";

const embaralharLivros = (arg: Livro[]) => {
  const a = arg.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}; // Embaralhar a lista de Livros da Bíblia

export default function Jogatina() {
  const navigate = useNavigate();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pausada, setPausada] = useState(false);
  const [livrosDaPartida] = useState<Livro[]>(() => embaralharLivros(livros));
  const [indiceLivro, setIndiceLivro] = useState(0);
  const [decorrente, setDecorrente] = useState(0); // Tempo decorrido na partida
  const [faltante, setFaltante] = useState(100); // Tempo que falta para acabar a partida ( 5 segundos )
  const tempoAoIniciar = useRef(0);
  const livro = livrosDaPartida[indiceLivro];
  const livrosRestantes = livrosDaPartida.length - indiceLivro - 1;

  function proximoLivro() {
    if (indiceLivro >= livrosDaPartida.length - 1) {
      fimDaPartida();
      return;
    }

    setIndiceLivro((indiceAtual) => indiceAtual + 1);
  } // Depois dos livros estarem sortido, seleciona sempre o primeiro item.

  function correcao(testamentoEscolhido: string) {
    const testamentoAtual = livro?.testamento;
    if (testamentoAtual === testamentoEscolhido) {
      proximoLivro();
      setFaltante(100);
      return;
    };
    fimDaPartida(); // Finaliza a partida por resposta errada
  } // Checagem se o Testamento escolhido corresponde com o Livro Atual

  const fimDaPartida = useCallback(() => {
    navigate("/final", {
      replace: true,
      state: { tempo: decorrente }
    });
  }, [decorrente, navigate]); // Finalizar partida

  useEffect(() => {
    if (pausada) return;
    if (tempoAoIniciar.current === 0) {
      tempoAoIniciar.current = Date.now();
    }

    const contador = setTimeout(() => {
      const tempoAtual = Number(((Date.now() - tempoAoIniciar.current) / 1000).toFixed(1));
      setDecorrente(tempoAtual);
      setFaltante((tempoRestante) => Math.max(0, tempoRestante - 2));
    }, 100);

    return () => clearTimeout(contador);
  }, [decorrente, pausada]);

  useEffect(() => {
    if (faltante === 0) fimDaPartida();
  }, [faltante, fimDaPartida]);

  return (
    <main className={styles.escopo}>
      <section
        className={styles.antigoTestamento}
        onClick={() => correcao("antigo")}
      >
        <span>Antigo</span>
      </section>

      <section className={styles.secaoDeIndicadores}>
        <div className={styles.barraDeTempo}>
          <div className={styles.tempoRestante} style={{ width: `${faltante}%` }}></div>
        </div>

        <div className={styles.indicadores}>
          <div className={styles.quantidadeFaltanteDeLivros}>
            <BookMarked size={18} strokeWidth={2.5} />
            <span>{livrosRestantes}</span>
          </div>

          <span className={styles.nomeDoLivroEmTela}>{livro?.nome}</span>

          <div className={styles.tempoDecorrido}>
            <Timer size={18} strokeWidth={2.5} />
            <span>{decorrente}</span>
          </div>
        </div>

        <div className={styles.gatilhosDaJogatina}>
          <button
            onClick={() => {
              setPausada(true);
              setMostrarModal(true);
            }}
          >
            <X size={26} strokeWidth={3} />
          </button>
          <button
            onClick={() => {
              setPausada(true);
              setMostrarModal(true);
            }}
          >
            <Pause size={24} strokeWidth={3} />
          </button>
        </div>
      </section>

      <section
        className={styles.novoTestamento}
        onClick={() => correcao("novo")}
      >
        <span>Novo</span>
      </section>

      {mostrarModal
        ? <ModalBase
            acaoModal="sair"
            onSair={() => navigate("/", { replace: true })}
            onFechar={() => {
              setPausada(false);
              setMostrarModal(false);
            }}
          />
        : false
      }
    </main>
  )
}