'use strict';

const PRECOS = {
  'Corte': 35,
  'Barba': 30,
  'Corte + barba': 60,
  'Sobrancelha': 15
};

const HORARIO = { abre: '09:00', fecha: '19:00', intervaloMin: 30 };

const REGEX = {
  nomeCompleto: /^\p{L}+(?:[ '-]\p{L}+)+$/u,
  nome: /^\p{L}+(?:[ '-]\p{L}+)*$/u,
  telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  senha: /^(?=.*\p{L})(?=.*\d).{6,}$/u
};

function hojeISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function agoraEmMinutos() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function validarCampo(input, regra) {
  const checar = () => {
    input.setCustomValidity('');
    if (input.value !== '') {
      input.setCustomValidity(regra(input.value) || '');
    }
  };
  input.addEventListener('input', checar);
  input.addEventListener('change', checar);
  checar();
  return checar;
}

function mostrarAviso(tipo, texto) {
  const aviso = document.createElement('div');
  aviso.className = `aviso aviso-${tipo}`;
  aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  aviso.textContent = texto;

  const cartaoAcesso = document.querySelector('.cartao-acesso .corpo');
  const cabecalho = document.querySelector('main .cabecalho-pagina');
  const principal = document.querySelector('main');

  if (cartaoAcesso) cartaoAcesso.prepend(aviso);
  else if (cabecalho) cabecalho.after(aviso);
  else if (principal) principal.prepend(aviso);
  else document.body.prepend(aviso);

  if (tipo === 'ok') {
    setTimeout(() => {
      aviso.classList.add('aviso-saindo');
      setTimeout(() => aviso.remove(), 450);
    }, 5000);
  }
}

function marcarMenuAtivo() {
  const nomeBase = (caminho) =>
    caminho.split('/').pop().replace(/\.(html?|php)$/i, '') || 'index';

  const secaoDaPagina = { 'agendamento-form': 'agenda' };

  const atual = nomeBase(location.pathname);
  const alvo = secaoDaPagina[atual] || atual;

  document.querySelectorAll('.topo nav a:not(.btn)').forEach((link) => {
    const url = new URL(link.href, location.href);
    if (url.hash) return;
    if (nomeBase(url.pathname) === alvo) {
      link.classList.add('ativo');
      link.setAttribute('aria-current', 'page');
    }
  });
}

function mostrarAvisosDaURL() {
  const params = new URLSearchParams(location.search);
  let mudou = false;

  if (params.get('sucesso')) {
    mostrarAviso('ok', params.get('sucesso'));
    params.delete('sucesso');
    mudou = true;
  }
  if (params.get('erro')) {
    mostrarAviso('erro', params.get('erro'));
    params.delete('erro');
    mudou = true;
  }

  if (mudou) {
    const resto = params.toString();
    history.replaceState(null, '', location.pathname + (resto ? `?${resto}` : '') + location.hash);
  }
}

function limparCamposDeTexto() {
  document.querySelectorAll('input[type="text"], input[type="email"]').forEach((input) => {
    input.addEventListener('change', () => {
      let valor = input.value.trim().replace(/\s+/g, ' ');
      if (input.type === 'email') valor = valor.toLowerCase();
      if (valor !== input.value) {
        input.value = valor;
        input.dispatchEvent(new Event('input'));
      }
    });
  });
}

function marcarCamposTocados() {
  document.querySelectorAll('input, select').forEach((campo) => {
    campo.addEventListener('blur', () => { if (campo.value !== '') campo.classList.add('tocado'); });
    campo.addEventListener('change', () => campo.classList.add('tocado'));
    campo.addEventListener('invalid', () => campo.classList.add('tocado'));
  });
}

function prepararCamposSenha() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const envoltorio = document.createElement('div');
    envoltorio.className = 'campo-senha';
    input.before(envoltorio);
    envoltorio.append(input);

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'mostrar-senha';
    botao.textContent = 'Mostrar';
    botao.setAttribute('aria-label', 'Mostrar senha');
    botao.setAttribute('aria-pressed', 'false');

    botao.addEventListener('click', () => {
      const vaiMostrar = input.type === 'password';
      input.type = vaiMostrar ? 'text' : 'password';
      botao.textContent = vaiMostrar ? 'Ocultar' : 'Mostrar';
      botao.setAttribute('aria-label', vaiMostrar ? 'Ocultar senha' : 'Mostrar senha');
      botao.setAttribute('aria-pressed', String(vaiMostrar));
      input.focus();
    });

    envoltorio.append(botao);

    input.form?.addEventListener('submit', () => { input.type = 'password'; });
  });
}

function validarCadastro() {
  const confirma = document.getElementById('confirma');
  if (!confirma) return;

  const nome = document.getElementById('nome');
  const senha = document.getElementById('senha');

  if (nome) {
    validarCampo(nome, (v) =>
      REGEX.nomeCompleto.test(v) ? '' : 'Digite nome e sobrenome, só com letras.');
  }

  validarCampo(senha, (v) =>
    REGEX.senha.test(v) ? '' : 'A senha precisa ter pelo menos 6 caracteres, com letras e números.');

  const checarConfirma = validarCampo(confirma, (v) =>
    v === senha.value ? '' : 'As senhas não conferem.');

  senha.addEventListener('input', checarConfirma);
}

function prepararAgendamento() {
  const servico = document.getElementById('servico');
  const barbeiro = document.getElementById('barbeiro_id');
  if (!servico || !barbeiro) return;

  const form = servico.form;
  const cliente = document.getElementById('cliente');
  const telefone = document.getElementById('telefone');
  const valor = document.getElementById('valor');
  const data = document.getElementById('data');
  const hora = document.getElementById('hora');
  const params = new URLSearchParams(location.search);

  const id = form.querySelector('input[name="id"]');
  if (id && id.value) {
    const titulo = document.querySelector('.cabecalho-pagina h1');
    const subtitulo = document.querySelector('.cabecalho-pagina p');
    const botaoSalvar = form.querySelector('[type="submit"]');
    if (titulo) titulo.textContent = 'Editar agendamento';
    if (subtitulo) subtitulo.textContent = 'Altere os dados e salve.';
    if (botaoSalvar) botaoSalvar.textContent = 'Salvar alterações';
    document.title = 'Editar agendamento | Barbearia Camaradas';
  }

  const barbeiroDaURL = params.get('barbeiro_id');
  if (barbeiroDaURL && !barbeiro.value &&
      [...barbeiro.options].some((op) => op.value === barbeiroDaURL)) {
    barbeiro.value = barbeiroDaURL;
  }

  const preencherValor = () => {
    const preco = PRECOS[servico.value];
    if (preco === undefined) return;
    valor.value = preco.toFixed(2);
    valor.dispatchEvent(new Event('input'));
    valor.classList.remove('campo-atualizado');
    void valor.offsetWidth;
    valor.classList.add('campo-atualizado');
  };
  servico.addEventListener('change', preencherValor);
  if (servico.value && !valor.value) preencherValor();

  if (cliente) {
    validarCampo(cliente, (v) =>
      REGEX.nome.test(v) ? '' : 'Use só letras no nome (sem números ou símbolos).');
  }

  if (telefone) {
    const mascarar = (texto) => {
      const d = texto.replace(/\D/g, '').slice(0, 11);
      if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
      if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 0) return `(${d}`;
      return '';
    };
    telefone.setAttribute('inputmode', 'numeric');
    telefone.setAttribute('maxlength', '15');
    telefone.addEventListener('input', () => { telefone.value = mascarar(telefone.value); });
    telefone.value = mascarar(telefone.value);
    validarCampo(telefone, (v) =>
      REGEX.telefone.test(v) ? '' : 'Telefone incompleto. Use o formato (43) 99999-9999.');
  }

  if (data) {
    if (!data.value || data.value >= hojeISO()) data.min = hojeISO();

    validarCampo(data, (v) => {
      if (!id?.value && v < hojeISO()) return 'Escolha uma data de hoje em diante.';
      const diaDaSemana = new Date(`${v}T00:00`).getDay();
      if (diaDaSemana === 0) return 'A barbearia não abre aos domingos.';
      return '';
    });
  }

  if (hora) {
    hora.min = HORARIO.abre;
    hora.max = HORARIO.fecha;
    hora.step = HORARIO.intervaloMin * 60;

    const checarHora = validarCampo(hora, (v) => {
      const minutos = paraMinutos(v);
      if (minutos < paraMinutos(HORARIO.abre) || minutos > paraMinutos(HORARIO.fecha)) {
        return `Os horários vão de ${HORARIO.abre} a ${HORARIO.fecha}.`;
      }
      if (minutos % HORARIO.intervaloMin !== 0) {
        return `Os horários são de ${HORARIO.intervaloMin} em ${HORARIO.intervaloMin} minutos (ex.: 09:00, 09:30).`;
      }
      if (data && data.value === hojeISO() && minutos <= agoraEmMinutos()) {
        return 'Esse horário de hoje já passou.';
      }
      return '';
    });

    data?.addEventListener('input', checarHora);
  }
}

function validarBarbeiro() {
  const nome = document.getElementById('nome_barbeiro');
  if (!nome) return;
  validarCampo(nome, (v) =>
    REGEX.nome.test(v) ? '' : 'Use só letras no nome do barbeiro.');
}

let modal = null;

function criarModal() {
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.hidden = true;
  fundo.innerHTML = `
    <div class="modal caixa" role="dialog" aria-modal="true"
         aria-labelledby="modal-titulo" aria-describedby="modal-texto">
      <h2 id="modal-titulo"></h2>
      <p id="modal-texto"></p>
      <div class="form-botoes">
        <button type="button" class="btn btn-contorno" data-acao="cancelar">Cancelar</button>
        <button type="button" class="btn btn-perigo" data-acao="confirmar">Excluir</button>
      </div>
    </div>`;
  document.body.append(fundo);

  const estado = { aoConfirmar: null, origem: null };
  const btnCancelar = fundo.querySelector('[data-acao="cancelar"]');
  const btnConfirmar = fundo.querySelector('[data-acao="confirmar"]');

  const fechar = () => {
    fundo.hidden = true;
    document.body.style.overflow = '';
    estado.origem?.focus();
  };

  btnCancelar.addEventListener('click', fechar);
  btnConfirmar.addEventListener('click', () => {
    const acao = estado.aoConfirmar;
    fechar();
    acao?.();
  });

  fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });

  fundo.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
    if (e.key === 'Tab') {
      const botoes = [btnCancelar, btnConfirmar].filter((b) => !b.hidden);
      const primeiro = botoes[0];
      const ultimo = botoes[botoes.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });

  return {
    abrir({ titulo, texto, textoConfirmar = 'Excluir', somenteAviso = false, aoConfirmar = null, origem = null }) {
      fundo.querySelector('#modal-titulo').textContent = titulo;
      fundo.querySelector('#modal-texto').textContent = texto;
      btnConfirmar.textContent = textoConfirmar;
      btnConfirmar.hidden = somenteAviso;
      btnCancelar.textContent = somenteAviso ? 'Entendi' : 'Cancelar';
      estado.aoConfirmar = aoConfirmar;
      estado.origem = origem;
      fundo.hidden = false;
      document.body.style.overflow = 'hidden';
      btnCancelar.focus();
    }
  };
}

function prepararExclusoes() {
  document.addEventListener('click', (e) => {
    const botao = e.target.closest('.btn-perigo');
    if (!botao || botao.closest('.modal')) return;
    e.preventDefault();

    modal ??= criarModal();

    const linha = botao.closest('tr, article');
    const nome = botao.dataset.nome ||
                 linha?.querySelector('td, h2')?.textContent.trim() ||
                 'este registro';
    const qtdAgendamentos = Number(botao.dataset.agendamentos || 0);

    if (qtdAgendamentos > 0) {
      const plural = qtdAgendamentos > 1 ? 'agendamentos' : 'agendamento';
      modal.abrir({
        titulo: 'Não dá pra excluir',
        texto: `${nome} tem ${qtdAgendamentos} ${plural}. Exclua ou passe esses horários para outro barbeiro antes.`,
        somenteAviso: true,
        origem: botao
      });
      return;
    }

    modal.abrir({
      titulo: 'Confirmar exclusão',
      texto: `Tem certeza que quer excluir ${nome}? Isso não pode ser desfeito.`,
      origem: botao,
      aoConfirmar: () => {
        const form = botao.closest('form');
        const href = botao.getAttribute('href');

        if (botao.tagName === 'BUTTON' && form) {
          form.requestSubmit(botao);
        } else if (href && href !== '#') {
          location.href = botao.href;
        } else {
          removerDaTela(linha);
          mostrarAviso('ok', 'Exclusão feita com sucesso.');
        }
      }
    });
  });
}

function removerDaTela(elemento) {
  if (!elemento) return;
  elemento.classList.add('saindo');
  setTimeout(() => {
    elemento.remove();
    preencherTabelasVazias();
  }, 300);
}

function preencherTabelasVazias() {
  document.querySelectorAll('table').forEach((tabela) => {
    const corpo = tabela.tBodies[0];
    if (!corpo || corpo.rows.length > 0) return;
    const colunas = tabela.tHead?.rows[0]?.cells.length || 1;
    const linha = corpo.insertRow();
    const celula = linha.insertCell();
    celula.colSpan = colunas;
    celula.className = 'vazio';
    celula.textContent = tabela.dataset.vazio || 'Nada cadastrado por aqui ainda.';
  });
}

function travarEnvioDuplo() {
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      const botao = form.querySelector('[type="submit"]');
      if (!botao || botao.disabled) return;
      setTimeout(() => {
        botao.dataset.textoOriginal = botao.textContent;
        botao.textContent = 'Enviando...';
        botao.disabled = true;
      }, 0);
    });
  });

  window.addEventListener('pageshow', () => {
    document.querySelectorAll('[data-texto-original]').forEach((botao) => {
      botao.textContent = botao.dataset.textoOriginal;
      botao.disabled = false;
      delete botao.dataset.textoOriginal;
    });
  });
}

function animarEntrada() {
  const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (semAnimacao || !('IntersectionObserver' in window)) return;

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      el.classList.add('visivel');
      observador.unobserve(el);
      setTimeout(() => el.classList.remove('revelar', 'visivel'), 900);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('main .caixa, .cartao-acesso').forEach((el, i) => {
    el.classList.add('revelar');
    el.style.setProperty('--atraso', `${(i % 4) * 80}ms`);
    observador.observe(el);
  });
}

marcarMenuAtivo();
mostrarAvisosDaURL();
limparCamposDeTexto();
marcarCamposTocados();
prepararCamposSenha();
validarCadastro();
prepararAgendamento();
validarBarbeiro();
prepararExclusoes();
preencherTabelasVazias();
travarEnvioDuplo();
animarEntrada();
