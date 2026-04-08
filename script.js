// CONFIGURAÇÕES
const CONFIG = {
    API_URL: 'https://api.jsonbin.io/v3/b/68b9f743d0ea881f4071dd7f',
    CAMINHO_IMG: './assets/images/',
    IMAGEM_PADRAO: 'agua.png',
    MAPA_IMAGENS: {
        "Super Cola": "super_cola.png",
        "Laranjone": "laranjone.png",
        "Super Cola Cereja": "super_cola_cereja.png",
        "Água": "agua.png",
        "Água sem Gás": "agua.png"
    }
};


// ESTADO DA APLICAÇÃO
const maquinaState = {
    refrigerantes: [],
    selecionado: null,
    saldo: 0.0
};


// CAMADA DE DADOS E LÓGICA
async function buscarRefrigerantesAPI() {
    try {
        const resposta = await fetch(CONFIG.API_URL);
        const dados = await resposta.json();
        return dados.record.bebidas;
    } catch (erro) {
        console.error("Erro na API:", erro);
        return null;
    }
}

function processarInsercaoMoeda(valor) {
    maquinaState.saldo += parseFloat(valor);
}

function verificarCompra() {
    if (!maquinaState.selecionado || maquinaState.saldo < maquinaState.selecionado.preco) {
        return { sucesso: false };
    }

    const troco = maquinaState.saldo - maquinaState.selecionado.preco;
    const saborComprado = maquinaState.selecionado.sabor;

    // Reseta o estado após a compra
    maquinaState.saldo = 0.0;
    maquinaState.selecionado = null;

    return { sucesso: true, troco, sabor: saborComprado };
}

function obterNomeArquivo(sabor) {
    return CONFIG.MAPA_IMAGENS[sabor] || CONFIG.IMAGEM_PADRAO;
}


// CAMADA DE INTERFACE (Manipulação do DOM)
function renderizarBotoes() {
    const container = document.getElementById('lista-refrigerantes');
    container.innerHTML = ''; // Limpa antes de renderizar

    maquinaState.refrigerantes.forEach(refri => {
        const botao = document.createElement('button');
        botao.className = 'botao-refri';

        const nomeArquivo = obterNomeArquivo(refri.sabor);

        botao.innerHTML = `
            <div class="refri-img-wrapper">
                <img src="${CONFIG.CAMINHO_IMG}${nomeArquivo}" alt="${refri.sabor}" class="refri-img" loading="lazy">
            </div>
            <span class="refri-sabor">${refri.sabor}</span>
            <span class="refri-preco">R$ ${refri.preco.toFixed(2)}</span>
        `;

        botao.addEventListener('click', () => selecionarRefrigerante(refri, botao));
        container.appendChild(botao);
    });
}

function selecionarRefrigerante(refri, elementoBotao) {
    document.querySelectorAll('.botao-refri').forEach(b => b.classList.remove('selecionado'));
    elementoBotao.classList.add('selecionado');

    maquinaState.selecionado = refri;
    atualizarVisorMensagem("Selecionado:");
    atualizarLinhaBebida(refri.sabor);
    tentarFinalizarCompra();
}

function atualizarVisoresUI() {
    document.getElementById('visor').innerText = `R$ ${maquinaState.saldo.toFixed(2)}`;
}

function atualizarVisorMensagem(texto) {
    document.getElementById('painel-mensagens').innerText = texto;
}

function atualizarLinhaBebida(nome) {
    document.getElementById('linha-bebida').innerText = nome || "-";
}

function animarEntrega(sabor) {
    const bin = document.querySelector('.dispenser-bin');
    bin.innerHTML = '';

    const img = document.createElement('img');
    img.src = `${CONFIG.CAMINHO_IMG}${obterNomeArquivo(sabor)}`;
    img.className = 'refri-entrega';
    bin.appendChild(img);

    setTimeout(() => {
        img.style.transition = "opacity 1s";
        img.style.opacity = "0";
        setTimeout(() => img.remove(), 1000);
    }, 5000);
}


// FLUXO PRINCIPAL E EVENTOS
function tentarFinalizarCompra() {
    const resultado = verificarCompra();

    if (resultado.sucesso) {
        let mensagem = `Refrigerante ${resultado.sabor} liberado!`;
        if (resultado.troco > 0) {
            mensagem += ` Troco: R$ ${resultado.troco.toFixed(2)}.`;
        }

        atualizarVisorMensagem(mensagem);
        atualizarLinhaBebida("PRONTO");
        animarEntrega(resultado.sabor);
        document.querySelectorAll('.botao-refri').forEach(b => b.classList.remove('selecionado'));
    }

    atualizarVisoresUI();
}

function configurarEventosDragAndDrop() {
    const moedas = document.querySelectorAll('.moeda');
    const ranhura = document.getElementById('ranhura-moedas');

    moedas.forEach(moeda => {
        moeda.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.valor);
        });
    });

    ranhura.addEventListener('dragover', (e) => {
        e.preventDefault();
        ranhura.classList.add('ranhura-ativa');
    });

    ranhura.addEventListener('dragleave', () => {
        ranhura.classList.remove('ranhura-ativa');
    });

    ranhura.addEventListener('drop', (e) => {
        e.preventDefault();
        ranhura.classList.remove('ranhura-ativa');

        const valorMoeda = e.dataTransfer.getData('text/plain');
        if (valorMoeda) {
            processarInsercaoMoeda(valorMoeda);
            atualizarVisoresUI();
            tentarFinalizarCompra();
        }
    });
}


// INICIALIZAÇÃO
async function iniciarApp() {
    configurarEventosDragAndDrop();
    atualizarVisoresUI();

    const dados = await buscarRefrigerantesAPI();

    if (dados) {
        maquinaState.refrigerantes = dados;
        renderizarBotoes();
    } else {
        atualizarVisorMensagem("Erro ao carregar. Máquina em manutenção.");
    }
}

// Garante que o script só rode após o HTML estar pronto
document.addEventListener('DOMContentLoaded', iniciarApp);