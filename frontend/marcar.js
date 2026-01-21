console.log("marcar.js carregou");
(async function () {
  const nome = document.getElementById("nome");
  const telefone = document.getElementById("telefone");
  const selServicos = document.getElementById("id_servico");
  const selFuncionarios = document.getElementById("id_funcionario");
  const inputData = document.getElementById("data");
  const selHora = document.getElementById("hora");
  const obs = document.getElementById("observacoes");
  const msg = document.getElementById("msg");

  const btnVerHoras = document.getElementById("btnVerHoras");
  const btnMarcar = document.getElementById("btnMarcar");

  function setMsg(t) {
    msg.textContent = t;
  }

  // 1) Carregar serviços
  const servRes = await fetch("http://localhost:3000/servicos");
  const servicos = await servRes.json();
  selServicos.innerHTML = servicos
    .map(s => `<option value="${s.id_servico}">${s.nome_servico}</option>`)
    .join("");

  // 2) Carregar funcionários
  const funcRes = await fetch("http://localhost:3000/funcionarios");
  const funcs = await funcRes.json();
  selFuncionarios.innerHTML = funcs
    .map(f => `<option value="${f.id_funcionario}">${f.nome_completo}</option>`)
    .join("");

  // 3) Carregar horas disponíveis
  async function carregarHorarios() {
    setMsg("");
    selHora.innerHTML = "";

    const id_servico = selServicos.value;
    const id_funcionario = selFuncionarios.value;
    const data = inputData.value;

    if (!id_servico || !id_funcionario || !data) {
      setMsg("Escolhe serviço, funcionário e data primeiro.");
      return;
    }

    const url = `http://localhost:3000/horarios-disponiveis?id_funcionario=${id_funcionario}&data=${data}&id_servico=${id_servico}`;
    const res = await fetch(url);
    const out = await res.json();

    if (!res.ok) {
      setMsg(out.erro || "Erro ao obter horários.");
      return;
    }

    if (!out.horarios || out.horarios.length === 0) {
      setMsg("Sem horários disponíveis nesse dia.");
      return;
    }

    selHora.innerHTML = out.horarios
      .map(h => `<option value="${h}">${h}</option>`)
      .join("");
  }

  btnVerHoras.addEventListener("click", carregarHorarios);

  // 4) Criar agendamento (cria/obtém cliente primeiro)
  btnMarcar.addEventListener("click", async () => {
    setMsg("");

    if (!nome.value.trim() || !telefone.value.trim()) {
      setMsg("Preenche nome e telefone.");
      return;
    }

    const id_servico = Number(selServicos.value);
    const id_funcionario = Number(selFuncionarios.value);
    const data = inputData.value;
    const hora = selHora.value;

    if (!data || !hora) {
      setMsg("Escolhe a data e carrega os horários para escolher uma hora.");
      return;
    }

    // 4.1) Criar/obter cliente
    const resCli = await fetch("http://localhost:3000/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.value.trim(), telefone: telefone.value.trim() })
    });

    const outCli = await resCli.json();
    if (!resCli.ok) {
      setMsg(outCli.erro || "Erro ao criar cliente.");
      return;
    }

    const id_cliente = outCli.id_cliente;

    // 4.2) Criar agendamento
    const resAg = await fetch("http://localhost:3000/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_cliente,
        id_funcionario,
        id_servico,
        data,
        hora,
        observacoes: obs.value.trim() || null
      })
    });

    const outAg = await resAg.json();

    if (!resAg.ok) {
      setMsg(outAg.erro || "Erro ao marcar.");
      return;
    }

    setMsg("✅ Agendamento criado! Está como Pendente (aguarda confirmação).");
    obs.value = "";
  });

})();
