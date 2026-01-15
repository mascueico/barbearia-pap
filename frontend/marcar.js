(async function () {
    const selServicos = document.getElementById("id_servico");
    const selFuncionarios = document.getElementById("id_funcionario");
    const inputData = document.getElementById("data");
    const selHora = document.getElementById("hora");
    const msg = document.getElementById("msg");
  
    const btnCarregar = document.getElementById("btnCarregarHoras");
  
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
  
    // 3) Função para carregar horários disponíveis
    async function carregarHorarios() {
      msg.textContent = "";
      selHora.innerHTML = "";
  
      const id_servico = selServicos.value;
      const id_funcionario = selFuncionarios.value;
      const data = inputData.value;
  
      if (!id_servico || !id_funcionario || !data) {
        msg.textContent = "Escolhe serviço, funcionário e data primeiro.";
        return;
      }
  
      const url = `http://localhost:3000/horarios-disponiveis?id_funcionario=${id_funcionario}&data=${data}&id_servico=${id_servico}`;
      const res = await fetch(url);
      const out = await res.json();
  
      if (!res.ok) {
        msg.textContent = out.erro || "Erro ao obter horários.";
        return;
      }
  
      if (!out.horarios || out.horarios.length === 0) {
        msg.textContent = "Sem horários disponíveis nesse dia.";
        return;
      }
  
      selHora.innerHTML = out.horarios
        .map(h => `<option value="${h}">${h}</option>`)
        .join("");
    }
  
    // Ao clicar “Ver horários”
    btnCarregar.addEventListener("click", carregarHorarios);
  
    // Extra: carregar horários automaticamente quando muda algo
    selServicos.addEventListener("change", () => { selHora.innerHTML = ""; });
    selFuncionarios.addEventListener("change", () => { selHora.innerHTML = ""; });
    inputData.addEventListener("change", () => { selHora.innerHTML = ""; });
  
  })();
  