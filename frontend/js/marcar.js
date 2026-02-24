console.log("✅ marcar.js carregou");

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('data').setAttribute('min', today);

// Get logged in user from localStorage
function getLoggedInUser() {
  const userData = localStorage.getItem('loggedInUser');
  return userData ? JSON.parse(userData) : null;
}

// Display user info or login prompt
function displayUserInfo() {
  const user = getLoggedInUser();
  const userInfoContainer = document.getElementById('user-info-container');
  const bookingForm = document.getElementById('booking-form');

  if (user) {
    // User is logged in
    userInfoContainer.innerHTML = `
      <div class="user-info">
        <div class="user-details">
          <div class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="user-name">Olá, ${user.nome_cliente}</div>
        </div>
        <button class="logout-btn" onclick="logout()">
          <i class="fas fa-sign-out-alt"></i> Sair
        </button>
      </div>
    `;
    // Fill in user information in the form
    document.getElementById('nome').value = user.nome_cliente;
    document.getElementById('email').value = user.email;
    document.getElementById('telefone').value = user.telefone;
    // Disable editing user info
    document.getElementById('nome').disabled = true;
    document.getElementById('email').disabled = true;
    document.getElementById('telefone').disabled = true;
  } else {
    // User is not logged in
    userInfoContainer.innerHTML = `
      <div class="login-prompt">
        <h3><i class="fas fa-lock"></i> Área restrita</h3>
        <p>Para fazer uma marcação, precisa de estar registado e autenticado.</p>
        <a href="login.html" class="btn">
          <i class="fas fa-sign-in-alt"></i> Login / Registar
        </a>
      </div>
    `;
    // Disable form
    bookingForm.style.display = 'none';
  }
}

// Logout function
function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
}

(async function () {
  // Display user info or login prompt
  displayUserInfo();

  // Check if user is logged in before continuing
  const user = getLoggedInUser();
  if (!user) {
    return;
  }

  const nome = document.getElementById("nome");
  const email = document.getElementById("email");
  const telefone = document.getElementById("telefone");
  const selServicos = document.getElementById("id_servico");
  const selFuncionarios = document.getElementById("id_funcionario");
  const inputData = document.getElementById("data");
  const selHora = document.getElementById("hora");
  const obs = document.getElementById("observacoes");
  const msg = document.getElementById("msg");

  const btnVerHoras = document.getElementById("btnVerHoras");
  const btnMarcar = document.getElementById("btnMarcar");

  let aMarcar = false; // ✅ bloqueia duplo clique

  function setMsg(t) {
    msg.textContent = t || "";
  }

  // placeholders iniciais
  selServicos.innerHTML = `<option value="">-- a carregar serviços --</option>`;
  selFuncionarios.innerHTML = `<option value="">-- a carregar funcionários --</option>`;
  selHora.innerHTML = `<option value="">-- escolhe serviço/funcionário/data --</option>`;

  // ============================
  // 1) Carregar serviços e funcionários
  // ============================
  try {
    // Serviços
    const servRes = await fetch("http://localhost:3000/servicos");
    console.log("Status /servicos:", servRes.status);

    const servicos = await servRes.json();
    console.log("Serviços recebidos:", servicos);

    if (!Array.isArray(servicos) || servicos.length === 0) {
      selServicos.innerHTML = `<option value="">(Sem serviços)</option>`;
      setMsg("⚠️ Sem serviços na BD.");
      return;
    }

    selServicos.innerHTML =
      `<option value="">-- escolhe um serviço --</option>` +
      servicos.map(s => `<option value="${s.id_servico}">${s.nome_servico}</option>`).join("");

    // Funcionários
    const funcRes = await fetch("http://localhost:3000/funcionarios");
    console.log("Status /funcionarios:", funcRes.status);

    const funcs = await funcRes.json();
    console.log("Funcionários recebidos:", funcs);

    if (!Array.isArray(funcs) || funcs.length === 0) {
      selFuncionarios.innerHTML = `<option value="">(Sem funcionários)</option>`;
      setMsg("⚠️ Sem funcionários na BD.");
      return;
    }

    selFuncionarios.innerHTML =
      `<option value="">-- escolhe um funcionário --</option>` +
      funcs.map(f => `<option value="${f.id_funcionario}">${f.nome_completo}</option>`).join("");

  } catch (e) {
    console.error(e);
    setMsg("❌ Erro a carregar listas. Confirma se o backend está a correr em http://localhost:3000");
    selServicos.innerHTML = `<option value="">(Erro)</option>`;
    selFuncionarios.innerHTML = `<option value="">(Erro)</option>`;
    return;
  }

  // ============================
  // 2) Carregar horas disponíveis
  // ============================
  async function carregarHorarios() {
    setMsg("");
    selHora.innerHTML = `<option value="">(A carregar...)</option>`;

    const id_servico = selServicos.value;
    const id_funcionario = selFuncionarios.value;
    const data = inputData.value;

    if (!id_servico || !id_funcionario || !data) {
      setMsg("Escolhe serviço, funcionário e data primeiro.");
      selHora.innerHTML = `<option value="">(Escolhe serviço/funcionário/data)</option>`;
      return;
    }

    try {
      const url =
        `http://localhost:3000/horarios-disponiveis` +
        `?id_funcionario=${encodeURIComponent(id_funcionario)}` +
        `&data=${encodeURIComponent(data)}` +
        `&id_servico=${encodeURIComponent(id_servico)}`;

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

      selHora.innerHTML =
        `<option value="">-- escolhe uma hora --</option>` +
        out.horarios.map(h => `<option value="${h}">${h}</option>`).join("");

    } catch (e) {
      console.error(e);
      setMsg("Erro ao obter horários (backend não respondeu).");
      selHora.innerHTML = `<option value="">(Erro)</option>`;
    }
  }

  btnVerHoras.addEventListener("click", carregarHorarios);

  // Se mudares serviço/funcionário/data, limpa horas
  function resetHoras() {
    selHora.innerHTML = `<option value="">(Carrega horários)</option>`;
  }
  selServicos.addEventListener("change", resetHoras);
  selFuncionarios.addEventListener("change", resetHoras);
  inputData.addEventListener("change", resetHoras);

  // ============================
  // 3) Criar agendamento
  // ============================
  btnMarcar.addEventListener("click", async () => {
    if (aMarcar) return;

    setMsg("");

    if (!nome.value.trim() || !telefone.value.trim()) {
      setMsg("Preenche nome e telefone.");
      return;
    }

    // Validar email (opcional mas recomendado)
    const emailValue = email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue && !emailRegex.test(emailValue)) {
      setMsg("Email inválido.");
      return;
    }

    const id_servico = Number(selServicos.value);
    const id_funcionario = Number(selFuncionarios.value);
    const data = inputData.value;
    const hora = selHora.value;

    if (!id_servico || !id_funcionario) {
      setMsg("Escolhe serviço e funcionário.");
      return;
    }

    if (!data) {
      setMsg("Escolhe uma data.");
      return;
    }

    if (!hora) {
      setMsg("Escolhe uma hora (carrega horários).");
      return;
    }

    // Check if booking time is in the past
    const bookingDateTime = new Date(`${data}T${hora}:00`);
    const now = new Date();
    if (bookingDateTime < now) {
      setMsg("Não pode marcar para um horário passado.");
      return;
    }

    const txtOriginal = btnMarcar.textContent;

    try {
      aMarcar = true;
      btnMarcar.disabled = true;
      btnMarcar.textContent = "A marcar...";

      console.log('Creating appointment with data:', {
        nome: nome.value.trim(),
        telefone: telefone.value.trim(),
        email: emailValue,
        id_servico,
        id_funcionario,
        data,
        hora,
        observacoes: obs.value.trim()
      });

      // 3.1) Criar/obter cliente
      const resCli = await fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.value.trim(),
          telefone: telefone.value.trim(),
          email: emailValue || null,
        }),
      });

      const outCli = await resCli.json();
      console.log('Client response:', resCli.status, outCli);
      
      if (!resCli.ok) {
        setMsg(outCli.erro || "Erro ao criar cliente.");
        return;
      }

      const id_cliente = outCli.id_cliente;
      console.log('Client ID:', id_cliente);

      // 3.2) Criar agendamento
      const resAg = await fetch("http://localhost:3000/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente,
          id_funcionario,
          id_servico,
          data,
          hora,
          observacoes: obs.value.trim() || null,
        }),
      });

      const outAg = await resAg.json();
      console.log('Appointment response:', resAg.status, outAg);

      if (!resAg.ok) {
        if (resAg.status === 409) {
          setMsg(outAg.erro || "Esse horário acabou de ficar ocupado. Carrega os horários novamente.");
        } else {
          setMsg(outAg.erro || "Erro ao marcar.");
        }
        return;
      }

      // ✅ sucesso
      setMsg("✅ Agendamento criado! Está como Pendente (aguarda confirmação).");

      // limpar observações
      obs.value = "";

      // atualizar lista de horas (para remover a hora ocupada)
      await carregarHorarios();

      // opcional: limpar a hora selecionada
      selHora.value = "";

    } catch (e) {
      console.error('Error:', e);
      setMsg("❌ Erro a comunicar com o servidor.");
    } finally {
      aMarcar = false;
      btnMarcar.disabled = false;
      btnMarcar.textContent = txtOriginal;
    }
  });
})();
