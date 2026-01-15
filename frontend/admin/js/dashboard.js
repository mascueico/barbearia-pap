(async function () {
  const loggedIn = localStorage.getItem("adminLoggedIn") === "true";
  if (!loggedIn) {
    window.location.href = "login.html";
    return;
  }

  const area = document.getElementById("agendamentosArea");

  const filtroStatus = document.getElementById("filtroStatus");
  const filtroData = document.getElementById("filtroData");
  const pesquisaCliente = document.getElementById("pesquisaCliente");
  const btnLimpar = document.getElementById("btnLimparFiltros");

  let agendamentos = [];

  function badgeStatus(status) {
    const s = (status || "").toLowerCase();
    if (s === "confirmado") return `<span class="badge badge-confirmado">Confirmado</span>`;
    if (s === "cancelado") return `<span class="badge badge-cancelado">Cancelado</span>`;
    return `<span class="badge badge-pendente">Pendente</span>`;
  }

  function formatarData(valor) {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? (valor ?? "") : d.toLocaleDateString("pt-PT");
  }

  // Aplica TODOS os filtros (estado + data + texto cliente)
  function aplicarFiltros(lista) {
    let out = [...lista];

    // 1) Estado
    const est = filtroStatus?.value || "Todos";
    if (est !== "Todos") {
      out = out.filter(a => (a.status ?? "Pendente") === est);
    }

    // 2) Data (input date vem "YYYY-MM-DD")
    const data = filtroData?.value;
    if (data) {
      out = out.filter(a => {
        // a.data_agendamento pode vir como Date/ISO; comparamos só pela parte YYYY-MM-DD
        const d = new Date(a.data_agendamento);
        if (isNaN(d.getTime())) return false;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}`;
        return iso === data;
      });
    }

    // 3) Pesquisa por cliente
    const q = (pesquisaCliente?.value || "").trim().toLowerCase();
    if (q) {
      out = out.filter(a => (a.cliente ?? "").toLowerCase().includes(q));
    }

    return out;
  }

  function renderTabela() {
    const lista = aplicarFiltros(agendamentos);

    if (!Array.isArray(lista) || lista.length === 0) {
      area.innerHTML = "<p>Sem agendamentos para estes filtros.</p>";
      return;
    }

    let html = `
      <div class="table-wrap">
        <table class="agendamentos">
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Funcionário</th>
              <th>Serviço</th>
              <th>Obs.</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
    `;

    lista.forEach(a => {
      const dataFmt = formatarData(a.data_agendamento);
      const hora = a.hora ?? "";
      const cliente = a.cliente ?? "";
      const funcionario = a.funcionario ?? "";
      const servico = a.servico ?? "";
      const obs = (a.observacoes ?? "").toString();
      const status = a.status ?? "Pendente";
      const id = a.id_agendamentos;

      // Dica: se observações forem longas, mostramos só um bocadinho e o resto no title
      const obsCurta = obs.length > 25 ? obs.slice(0, 25) + "…" : obs;

      html += `
        <tr>
          <td>${dataFmt}</td>
          <td>${hora}</td>
          <td>${cliente}</td>
          <td>${funcionario}</td>
          <td>${servico}</td>
          <td title="${obs.replaceAll('"', "&quot;")}">${obsCurta || "-"}</td>
          <td>${badgeStatus(status)}</td>
          <td>
            <button class="btn btn-confirmar" data-acao="status" data-id="${id}" data-status="Confirmado">Confirmar</button>
            <button class="btn btn-cancelar"  data-acao="status" data-id="${id}" data-status="Cancelado">Cancelar</button>
            <button class="btn"              data-acao="status" data-id="${id}" data-status="Pendente">Pendente</button>
            <button class="btn"              data-acao="apagar" data-id="${id}">Apagar</button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    area.innerHTML = html;

    // Event delegation (1 handler para todos os botões)
    area.querySelectorAll("button[data-acao]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const acao = btn.getAttribute("data-acao");
        const id = btn.getAttribute("data-id");

        if (acao === "status") {
          const novoStatus = btn.getAttribute("data-status");
          await alterarStatus(id, novoStatus);
        }

        if (acao === "apagar") {
          const ok = confirm("Tens a certeza que queres apagar este agendamento?");
          if (ok) await apagarAgendamento(id);
        }
      });
    });
  }

  async function carregarAgendamentos() {
    try {
      area.textContent = "A carregar...";
      const res = await fetch("http://localhost:3000/agendamentos");
      if (!res.ok) throw new Error("Erro ao obter agendamentos");

      agendamentos = await res.json();
      renderTabela();
    } catch (e) {
      area.textContent = "Erro ao carregar agendamentos";
      console.error(e);
    }
  }

  async function alterarStatus(id, status) {
    try {
      const res = await fetch(`http://localhost:3000/agendamentos/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error("Erro ao atualizar estado");
      await carregarAgendamentos();
    } catch (e) {
      alert("Erro ao alterar estado");
      console.error(e);
    }
  }

  async function apagarAgendamento(id) {
    try {
      const res = await fetch(`http://localhost:3000/agendamentos/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Erro ao apagar");
      await carregarAgendamentos();
    } catch (e) {
      alert("Erro ao apagar agendamento");
      console.error(e);
    }
  }

  // Eventos dos filtros
  filtroStatus?.addEventListener("change", renderTabela);
  filtroData?.addEventListener("change", renderTabela);
  pesquisaCliente?.addEventListener("input", renderTabela);

  btnLimpar?.addEventListener("click", () => {
    if (filtroStatus) filtroStatus.value = "Todos";
    if (filtroData) filtroData.value = "";
    if (pesquisaCliente) pesquisaCliente.value = "";
    renderTabela();
  });

  // Logout
  document.getElementById("btnLogout")?.addEventListener("click", () => {
    localStorage.setItem("adminLoggedIn", "false");
    window.location.href = "login.html";
  });

  carregarAgendamentos();
})();
