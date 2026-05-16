import { ActivityRecord } from './activity-history';

/**
 * Serviço de exportação de relatórios
 */
export class ExportService {
  /**
   * Exporta atividades como CSV
   */
  static generateCSV(records: ActivityRecord[]): string {
    const headers = ['ID', 'Tipo', 'Mensagem', 'Usuário', 'Tipo de Dado', 'Data e Hora'];
    const rows = records.map((record) => [
      record.id,
      record.type,
      `"${record.message.replace(/"/g, '""')}"`, // Escapar aspas
      record.userName,
      record.dataType,
      new Date(record.timestamp).toLocaleString('pt-BR'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }

  /**
   * Exporta atividades como JSON
   */
  static generateJSON(records: ActivityRecord[]): string {
    return JSON.stringify(records, null, 2);
  }

  /**
   * Gera conteúdo HTML para PDF
   */
  static generateHTML(records: ActivityRecord[], title: string = 'Relatório de Atividades'): string {
    const generateDate = new Date().toLocaleString('pt-BR');
    const stats = this.calculateStats(records);

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 30px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-box {
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #6366f1;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 20px;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
      font-size: 12px;
    }
    table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #374151;
    }
    table tr:nth-child(even) {
      background: #f9fafb;
    }
    .footer {
      background: #f3f4f6;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .type-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: #e0e7ff;
      color: #4f46e5;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${title}</h1>
      <p>Gerado em ${generateDate}</p>
    </div>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-number">${records.length}</div>
        <div class="stat-label">Total de Atividades</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.uniqueUsers}</div>
        <div class="stat-label">Usuários</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.uniqueTypes}</div>
        <div class="stat-label">Tipos de Ação</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.uniqueDataTypes}</div>
        <div class="stat-label">Tipos de Dados</div>
      </div>
    </div>

    <div class="content">
      <div class="section-title">Atividades Detalhadas</div>
      <table>
        <thead>
          <tr>
            <th>Data e Hora</th>
            <th>Tipo</th>
            <th>Mensagem</th>
            <th>Usuário</th>
            <th>Tipo de Dado</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (record) => `
          <tr>
            <td>${new Date(record.timestamp).toLocaleString('pt-BR')}</td>
            <td><span class="type-badge">${record.type}</span></td>
            <td>${record.message}</td>
            <td>${record.userName}</td>
            <td>${record.dataType}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="section-title">Resumo por Tipo de Ação</div>
      <table>
        <thead>
          <tr>
            <th>Tipo de Ação</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(stats.byType)
            .map(
              ([type, count]) => `
          <tr>
            <td><span class="type-badge">${type}</span></td>
            <td>${count}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="section-title">Resumo por Usuário</div>
      <table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Atividades</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(stats.byUser)
            .sort(([, a], [, b]) => b - a)
            .map(
              ([user, count]) => `
          <tr>
            <td>${user}</td>
            <td>${count}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Relatório confidencial - Reunião de Jovens</p>
      <p>Gerado automaticamente em ${generateDate}</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Calcula estatísticas dos registros
   */
  private static calculateStats(records: ActivityRecord[]) {
    const byType: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byDataType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueTypes = new Set<string>();
    const uniqueDataTypes = new Set<string>();

    records.forEach((record) => {
      byType[record.type] = (byType[record.type] || 0) + 1;
      byUser[record.userName] = (byUser[record.userName] || 0) + 1;
      byDataType[record.dataType] = (byDataType[record.dataType] || 0) + 1;
      uniqueUsers.add(record.userName);
      uniqueTypes.add(record.type);
      uniqueDataTypes.add(record.dataType);
    });

    return {
      byType,
      byUser,
      byDataType,
      uniqueUsers: uniqueUsers.size,
      uniqueTypes: uniqueTypes.size,
      uniqueDataTypes: uniqueDataTypes.size,
    };
  }

  /**
   * Cria blob para download
   */
  static createBlob(content: string, type: string): Blob {
    return new Blob([content], { type });
  }

  /**
   * Gera nome de arquivo com data
   */
  static generateFileName(format: 'csv' | 'json' | 'pdf'): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `relatorio-atividades-${date}-${time}.${format}`;
  }
}
