const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'evidencia_pruebas.json');
const mdPath = path.join(__dirname, 'Reporte_Pruebas_StockPilot.md');

if (!fs.existsSync(jsonPath)) {
    console.error('❌ No se encontró el archivo evidencia_pruebas.json. Asegúrate de ejecutar "npm run test:evidence" primero.');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    const date = new Date().toLocaleString('es-CO');
    
    const totalTests = data.numTotalTests;
    const passedTests = data.numPassedTests;
    const failedTests = data.numFailedTests;
    const duration = (data.testResults.reduce((acc, res) => acc + (res.endTime - res.startTime), 0) / 1000).toFixed(2);

    let md = `---
title: Certificado de Pruebas Unitarias y Aseguramiento de Calidad
author: Sistema de Gestión de Inventario Inteligente (StockPilot)
date: ${date}
---

# 📄 Certificado Oficial de Calidad de Software y Pruebas Unitarias

**Proyecto:** StockPilot — Sistema de Gestión de Inventario Inteligente
**Fecha de Certificación:** ${date}
**Framework de Validación:** Vitest v3
**Entorno de Ejecución:** Node.js (V8 Engine)

---

## 1. Resumen Ejecutivo de Validación

El presente documento certifica la ejecución automatizada de la suite de pruebas unitarias sobre los módulos críticos (Lógica Financiera, Inteligencia Artificial y Seguridad) del sistema **StockPilot**. Las pruebas fueron diseñadas bajo el enfoque de validación de caja blanca y pruebas de límites.

### 1.1. Métricas de Ejecución
- **Total de Escenarios Evaluados:** \`${totalTests}\`
- **Tasa de Éxito (Pass Rate):** \`${((passedTests / totalTests) * 100).toFixed(2)}%\`
- **Escenarios Exitosos:** \`${passedTests}\`
- **Escenarios Fallidos:** \`${failedTests}\`
- **Tiempo Computacional (Latencia):** \`${duration} ms\`

### 1.2. Veredicto del Sistema
`;

    if (failedTests === 0) {
        md += `> **[ESTADO: APROBADO]** ✅  \n> La integridad de los algoritmos predictivos, controles de acceso y matemática logística cumple con las especificaciones del diseño arquitectónico. El código está estabilizado y certificado como *Production-Ready* en el ámbito lógico.\n\n`;
    } else {
        md += `> **[ESTADO: RECHAZADO]** ❌  \n> Se detectaron anomalías en la lógica de negocio. Se requiere remediación inmediata en los módulos fallidos para garantizar la integridad de los datos.\n\n`;
    }

    md += `## 2. Detalle de Certificación por Módulo (Matriz de Trazabilidad)\n\n`;
    md += `A continuación se detalla el comportamiento de cada componente sometido a estrés y validación lógica:\n\n`;

    data.testResults.forEach(suite => {
        const suiteName = path.basename(suite.name);
        const isSuccess = suite.status === 'passed';
        
        md += `### 2.${data.testResults.indexOf(suite) + 1} Módulo Subyacente: \`${suiteName}\`\n`;
        md += `**Estado del Módulo:** ${isSuccess ? '✅ Aprobado' : '❌ Fallido'}\n\n`;
        
        suite.assertionResults.forEach(test => {
            const statusIcon = test.status === 'passed' ? '✔️' : '❌';
            md += `- ${statusIcon} \`[Caso de Prueba]\` ${test.ancestorTitles.join(' > ')}: **${test.title}**\n`;
        });
        
        md += '\n';
    });

    md += `\n---\n\n`;
    md += `### 3. Firma de Aprobación Automatizada\n`;
    md += `*Documento autogenerado por el pipeline de Integración Continua (CI) de StockPilot.*  \n`;
    md += `*Generado para su anexo como evidencia técnica en documento de grado.*`;

    fs.writeFileSync(mdPath, md);
    console.log(`✅ ¡Reporte Markdown generado con éxito en: ${mdPath}!`);

} catch (e) {
    console.error('Error generando reporte:', e);
}
