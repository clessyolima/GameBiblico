import { Gamepad2Icon, Home, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./Final.module.scss";

import Cabecalho from "../../components/Header";
import Podio from "../../components/Podio";
import DemaisJogadores from "../../components/DemaisJogadores";
import type { Jogador } from "../../interfaces/Jogador";
import { buscarClassificacao } from "../../services/myJson";
import { obterOuCriarJogadorLocal } from "../../utils/jogadorLocal";

export default function Final() {
  const navigate = useNavigate();
  const location = useLocation();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [compartilhando, setCompartilhando] = useState(false);
  const [mensagemCompartilhamento, setMensagemCompartilhamento] = useState("");
  const livroErrado = typeof location.state?.livroErrado === "string"
    ? location.state.livroErrado
    : "";
  const respostaEscolhida = typeof location.state?.respostaEscolhida === "string"
    ? location.state.respostaEscolhida === "novo"
      ? "Novo Testamento"
      : "Antigo Testamento"
    : "";
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

  useEffect(() => {
    function reiniciarComEnter(evento: KeyboardEvent) {
      if (evento.key !== "Enter" || evento.repeat) return;

      evento.preventDefault();
      navigate("/jogatina");
    }

    window.addEventListener("keydown", reiniciarComEnter);
    return () => window.removeEventListener("keydown", reiniciarComEnter);
  }, [navigate]);

  async function criarImagemCompartilhada() {
    const imagem = new Image();
    imagem.src = "/banner.png";

    await new Promise<void>((resolve, reject) => {
      imagem.onload = () => resolve();
      imagem.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    });

    const tela = document.createElement("canvas");
    tela.width = 1080;
    tela.height = 1080;
    const contexto = tela.getContext("2d");
    if (!contexto) throw new Error("Não foi possível criar a imagem.");

    const escala = Math.max(tela.width / imagem.width, tela.height / imagem.height);
    const largura = imagem.width * escala;
    const altura = imagem.height * escala;
    contexto.drawImage(imagem, (tela.width - largura) / 2, (tela.height - altura) / 2, largura, altura);

    contexto.fillStyle = "rgba(9, 35, 64, 0.72)";
    contexto.fillRect(0, 710, tela.width, 370);

    contexto.fillStyle = "#FFF";
    contexto.font = "700 48px Poppins, sans-serif";
    contexto.textAlign = "center";
    contexto.fillText("MINHA COLOCAÇÃO", tela.width / 2, 790);

    contexto.fillStyle = "#F8C74A";
    contexto.font = "900 150px Poppins, sans-serif";
    contexto.fillText(`${textoColocacao}º`, tela.width / 2, 925);

    contexto.fillStyle = "#FFF";
    contexto.font = "700 38px Poppins, sans-serif";
    contexto.fillText("Desafio você a jogar o Game Bíblico!", tela.width / 2, 1010);

    return await new Promise<Blob>((resolve, reject) => {
      tela.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível gerar a imagem."));
      }, "image/png", 1);
    });
  }

  async function compartilharResultado() {
    if (compartilhando) return;

    setCompartilhando(true);
    setMensagemCompartilhamento("");

    try {
      const imagem = await criarImagemCompartilhada();
      const texto = `Fiquei em ${textoColocacao}º lugar no Game Bíblico! Venha jogar também.`;
      const url = window.location.origin;
      const arquivo = new File([imagem], "resultado-game-biblico.png", { type: "image/png" });
      const dados: ShareData = { title: "Meu resultado no Game Bíblico", text: texto, url, files: [arquivo] };
      const navegador = navigator as Navigator & {
        canShare?: (dados: ShareData) => boolean;
        share?: (dados: ShareData) => Promise<void>;
      };

      if (navegador.share) {
        if (!navegador.canShare || navegador.canShare(dados)) {
          await navegador.share(dados);
        } else {
          await navegador.share({ title: dados.title, text: texto, url });
          setMensagemCompartilhamento("Este navegador não permite compartilhar a imagem; o menu enviou o texto e o link do jogo.");
        }
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(imagem);
      link.download = "resultado-game-biblico.png";
      link.click();
      URL.revokeObjectURL(link.href);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${texto} ${url}`);
        setMensagemCompartilhamento("Imagem baixada e resultado copiado.");
      } else {
        setMensagemCompartilhamento("Imagem baixada.");
      }
    } catch (erro: unknown) {
      if (erro instanceof DOMException && erro.name === "AbortError") return;
      console.error("Não foi possível compartilhar o resultado:", erro);
      setMensagemCompartilhamento("Não foi possível compartilhar.");
    } finally {
      setCompartilhando(false);
    }
  }

  return (
    <main className={styles.escopo}>
      <Cabecalho tituloPagina="Resumo" className={styles.secaoCabecalho} />

      <section className={styles.secaoResultadoDaPartida}>
        <p className={styles.fraseResultadoDaPartida}>
          Incrível você ficou em
          <span className={styles.colocacaoDaPartida}>{textoColocacao}º</span>
          lugar!
        </p>
        {livroErrado
          ? <p className={styles.livroErrado}>
              Você errou <strong>{livroErrado}</strong>. Resposta escolhida: <strong>{respostaEscolhida}</strong>.
            </p>
          : null
        }
      </section>

      <section className={styles.secaoCompartilharResultado}>
        <button
          className={styles.botaoCompartilharResultado}
          onClick={compartilharResultado}
          disabled={compartilhando}
        >
          <Share2 size={16} strokeWidth={2.5} />
          {compartilhando ? "Preparando..." : "Compartilhe"}
        </button>
        {mensagemCompartilhamento
          ? <p className={styles.mensagemCompartilhamento} aria-live="polite">
              {mensagemCompartilhamento}
            </p>
          : null
        }
      </section>

      {jogadores.length > 0
        ? <>
            <Podio jogadores={jogadores} />
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