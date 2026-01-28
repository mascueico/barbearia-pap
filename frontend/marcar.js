console.log("✅ marcar.js carregou");

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

  // placeholders (assim vês logo se o JS está a mexer nos selects)
  selServicos.innerHTML = `<option value="">-- a carregar serviços --</option>`;
  selFuncionarios.innerHTML = `<option value="">-- a carregar funcionários --</option>`;
  selHora.innerHTML = `<option value="">-- escolhe serviço/funcionário/data --</option>`;

  try {
    // 1) Carregar serviços
    const servRes = await fetch("http://localhost:3000/servicos");
    console.log("Status /servicos:", servRes.status);

    const servicos = await servRes.json();
    console.log("Serviços recebidos:", servicos);

    if (!Array.isArray(servicos) || servicos.length === 0) {
      selServicos.innerHTML = `<option value="">(Sem serviços)</option>`;
      setMsg("⚠️ A API /servicos devolveu vazio. Confirma se estás a ligar à BD certa.");
      return;
    }

    selServicos.innerHTML = servicos
      .map(s => `<option value="${s.id_servico}">${s.nome_servico}</option>`)
      .join("");

    // 2) Carregar funcionários
    const funcRes = await fetch("http://localhost:3000/funcionarios");
    console.log("Status /funcionarios:", funcRes.status);

    const funcs = await funcRes.json();
    console.log("Funcionários recebidos:", funcs);

    if (!Array.isArray(funcs) || funcs.length === 0) {
      selFuncionarios.innerHTML = `<option value="">(Sem funcionários)</option>`;
      setMsg("⚠️ A API /funcionarios devolveu vazio.");
      return;
    }

    selFuncionarios.innerHTML = funcs
      .map(f => `<option value="${f.id_funcionario}">${f.nome_completo}</option>`)
      .join("");

  } catch (e) {
    console.error(e);
    setMsg("❌ Erro a carregar listas. Confirma se o backend está a correr em http://localhost:3000");
    selServicos.innerHTML = `<option value="">(Erro)</option>`;
    selFuncionarios.innerHTML = `<option value="">(Erro)</option>`;
    return;
  }

  // 3) Carregar horas disponíveis
  async function carregarHorarios() {
    setMsg("");
    selHora.innerHTML = "";

    const id_servico = selServicos.value;
    const id_funcionario = selFuncionarios.value;
    const data = inputData.value;

    if (!id_servico || !id_funcionario || !data) {
      setMsg("Escolhe serviço, funcionário e data primeiro.");
      selHora.innerHTML = `<option value="">(Escolhe serviço/funcionário/data)</option>`;
      return;
    }

    try {
      const url = `http://localhost:3000/horarios-disponiveis?id_funcionario=${id_funcionario}&data=${data}&id_servico=${id_servico}`;
      const res = await fetch(url);
      const out = await res.json();

      if (!res.ok) {
        setMsg(out.erro || "Erro ao obter horários.");
        selHora.innerHTML = `<option value="">(Erro)</option>`;
        return;
      }

      if (!out.horarios || out.horarios.length === 0) {
        setMsg("Sem horários disponíveis nesse dia.");
        selHora.innerHTML = `<option value="">(Sem horários)</option>`;
        return;
      }

      selHora.innerHTML = out.horarios
        .map(h => `<option value="${h}">${h}</option>`)
        .join("");

    } catch (e) {
      console.error(e);
      setMsg("Erro ao obter horários (backend não respondeu).");
      selHora.innerHTML = `<option value="">(Erro)</option>`;
    }
  }

  btnVerHoras.addEventListener("click", carregarHorarios);

  // Extra: se mudares serviço/funcionário/data, limpa horas
  selServicos.addEventListener("change", () => {
    selHora.innerHTML = `<option value="">(Carrega horários)</option>`;
  });
  selFuncionarios.addEventListener("change", () => {
    selHora.innerHTML = `<option value="">(Carrega horários)</option>`;
  });
  inputData.addEventListener("change", () => {
    selHora.innerHTML = `<option value="">(Carrega horários)</option>`;
  });

  // 4) Criar agendamento
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

    try {
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

    } catch (e) {
      console.error(e);
      setMsg("❌ Erro a comunicar com o servidor.");
    }
  });

})();
