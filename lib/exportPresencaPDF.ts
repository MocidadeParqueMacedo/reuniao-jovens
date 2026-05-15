import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface PresencaData {
  meetingDate: string;
  members: Array<{
    nome: string;
    presente: boolean;
  }>;
  totalPresentes: number;
  totalAusentes: number;
  percentualPresenca: number;
}

// Simple text-based PDF generation for compatibility
export async function exportPresencaToPDF(data: PresencaData): Promise<void> {
  try {
    // Create a simple text representation
    let content = `RELATÓRIO DE PRESENÇA - REUNIÃO DE JOVENS\n`;
    content += `=====================================\n\n`;
    content += `Data: ${data.meetingDate}\n\n`;
    content += `ESTATÍSTICAS:\n`;
    content += `Total de Presentes: ${data.totalPresentes}\n`;
    content += `Total de Ausentes: ${data.totalAusentes}\n`;
    content += `Percentual de Presença: ${data.percentualPresenca.toFixed(1)}%\n\n`;
    content += `LISTA DE PRESENÇA:\n`;
    content += `=====================================\n`;

    data.members.forEach((member, index) => {
      const status = member.presente ? '[✓] Presente' : '[✗] Ausente';
      content += `${index + 1}. ${member.nome} - ${status}\n`;
    });

    // Save as text file
    const fileName = `presenca_${new Date().toISOString().split('T')[0]}.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, content);

    // Share file
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/plain',
      dialogTitle: 'Compartilhar Relatório de Presença',
    });
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    throw error;
  }
}
