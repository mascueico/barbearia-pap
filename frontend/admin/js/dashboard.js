(async function () {
    // 1) Verifica se o admin está logado
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!loggedIn) {
      window.location.href = 'login.html';
      return;
    }
  
    // 2) Elementos do HTML
    const area = document.getElementById('agendamentosArea');
    const filtroStatus = document.getElementById('filtroStatus');
  
    // 3) Guardamos os agendamentos aqui para poder filtrar sem ir sempre à API
    let agendamentos = [];
  
    // 4) Função auxiliar: badge do estado
    function badgeStatus(status) {
      const s = (status || '').toLowerCase();
      if (s === 'confirmado') return `<span class="badge badge-confirmado">Confirmado</span>`;
      if (s === 'cancelado') return `<span class="badge badge-cancelado">Cancelado</span>`;
      return `<span class="badge badge-pendente">Pendente</span>`;
    }
  
    // 5) Função auxiliar: formatar data
    function formatarData(valor) {
      const d = new Date(valor);
      return isNaN(d.getTime()) ? (valor ?? '') : d.toLocaleDateString('pt-PT');
    }
  
    // 6) Desenha a tabela, mas usando uma lista que já pode vir filtrada
    function renderTabela(lista) {
      if (!Array.isArray(lista) || lista.length === 0) {
        area.innerHTML = '<p>Sem agendamentos para este filtro.</p>';
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
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
      `;
  
      lista.forEach(a => {
        const dataFmt = formatarData(a.data_agendamento);
        const hora = a.hora ?? '';
        const cliente = a.cliente ?? '';
        const funcionario = a.funcionario ?? '';
        const servico = a.servico ?? '';
        const status = a.status ?? 'Pendente';
        const id = a.id_agendamentos;
  
        // Desativa botões quando já está nesse estado (opcional)
        const disableConfirmar = status.toLowerCase() === 'confirmado' ? 'disabled' : '';
        const disableCancelar = status.toLowerCase() === 'cancelado' ? 'disabled' : '';
  
        html += `
          <tr>
            <td>${dataFmt}</td>
            <td>${hora}</td>
            <td>${cliente}</td>
            <td>${funcionario}</td>
            <td>${servico}</td>
            <td>${badgeStatus(status)}</td>
            <td>
              <button class="btn btn-confirmar" ${disableConfirmar}
                data-id="${id}" data-status="Confirmado">
                Confirmar
              </button>
  
              <button class="btn btn-cancelar" ${disableCancelar}
                data-id="${id}" data-status="Cancelado">
                Cancelar
              </button>
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
  
      // Liga os botões após desenhar a tabela
      area.querySelectorAll('button[data-id][data-status]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const novoStatus = btn.getAttribute('data-status');
          await alterarStatus(id, novoStatus);
        });
      });
    }
  
    // 7) Aplica o filtro escolhido (Todos / Pendente / Confirmado / Cancelado)
    function aplicarFiltro() {
      const filtro = filtroStatus?.value || 'Todos';
  
      if (filtro === 'Todos') {
        renderTabela(agendamentos);
        return;
      }
  
      const filtrados = agendamentos.filter(a => (a.status ?? 'Pendente') === filtro);
      renderTabela(filtrados);
    }
  
    // 8) Vai buscar os agendamentos à API e guarda na variável global
    async function carregarAgendamentos() {
      try {
        area.textContent = 'A carregar...';
  
        const res = await fetch('http://localhost:3000/agendamentos');
        if (!res.ok) throw new Error('Erro ao obter agendamentos');
  
        agendamentos = await res.json();
  
        // Depois de carregar, desenha já com o filtro atual
        aplicarFiltro();
  
      } catch (e) {
        area.textContent = 'Erro ao carregar agendamentos';
        console.error(e);
      }
    }
  
    // 9) Faz PUT para atualizar status e volta a carregar
    async function alterarStatus(id, novoStatus) {
      try {
        const res = await fetch(`http://localhost:3000/agendamentos/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: novoStatus })
        });
  
        if (!res.ok) throw new Error('Erro ao atualizar estado');
  
        // Recarrega tudo (assim a tabela reflete a BD)
        await carregarAgendamentos();
  
      } catch (e) {
        alert('Erro ao alterar estado do agendamento');
        console.error(e);
      }
    }
  
    // 10) Quando mudas o dropdown, aplica o filtro imediatamente
    filtroStatus?.addEventListener('change', aplicarFiltro);
  
    // 11) Logout
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      localStorage.setItem('adminLoggedIn', 'false');
      window.location.href = 'login.html';
    });
  
    // 12) Arranca a página
    carregarAgendamentos();
  })();
  