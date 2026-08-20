# Sistema de Gerenciamento e Triagem de Tickets

Sistema desenvolvido para o **Google Apps Script** voltado à gestão, triagem e análise de tickets de estudantes e solicitações para o projeto de extensão TechSI Prepare. O projeto conta com uma interface web simples (HTML/CSS/JS) integrada diretamente às planilhas e serviços do ecossistema Google.

---

## 📌 Visão Geral

A aplicação permite que equipes gerenciem o fluxo completo de atendimento de solicitações:
1. **Triagem de Chamados:** Recebimento, categorização e vinculação de informações iniciais.
2. **Fila de Análise & Reanálise:** Visualização de tickets distribuídos por abas de status (*Pronto para Análise*, *Em Análise*, *Pronto para Reanálise*, *Devolvidos*, *Aprovados*, *Rejeitados*).
3. **Histórico e Duplicidades:** Mapeamento de histórico de solicitações para identificação de chamados anteriores relativos à mesma demanda.
4. **Comunicação e Rascunhos:** Criação e integração de respostas via Gmail e links para formulários de reenvio.

---

## 🛠️ Tecnologias Utilizadas

* **Backend / Scripting:** Google Apps Script (`.gs`)
* **Frontend:** HTML5, CSS3 e JavaScript Vanilla (modularizado em arquivos `.html`)
* **Integrações:** Google Sheets (Armazenamento de dados) e Gmail (Gerenciamento de e-mails)

---

## 📂 Estrutura do Projeto

* **`Index.html`**: Estrutura base da interface web.
* **`Styles.html`**: Estilização CSS completa da interface (layouts responsivos, modais e componentes).
* **`Components.html`**: Componentes reutilizáveis da interface de usuário.
* **`ModalService.html`**: Lógica de gerenciamento de modais (confirmações, justificativas e navegação em filas).
* **`Data.html`**: Camada de integração frontend-backend (`google.script.run`) e gerenciamento de estado.
* **`Properties.gs`**: Leitura segura de variáveis do ambiente via `PropertiesService`.
* **`App.html` / Scripts Backend**: Inicialização da aplicação e lógica de negócio do Google Apps Script.

---

## ⚙️ Configuração e Instalação

### 1. Requisitos
* Uma conta Google com acesso ao Google Drive, Google Sheets e Google Apps Script.

### 2. Configuração de Variáveis de Ambiente
O projeto utiliza o `PropertiesService` para ocultar IDs e URLs sensíveis. 

No painel do Apps Script, navegue até **Configurações do Projeto** > **Propriedades do Script** e defina as chaves:
* `SPREADSHEET_ID`: ID da planilha Google que serve como banco de dados.
* `FORM_REENVIO_URL`: URL do formulário utilizado para reenvio de informações/vídeos.

### 3. Execução
1. Faça o deploy do projeto como **Web App** no Google Apps Script.
2. Defina as permissões de acesso conforme necessário para a sua equipe.
3. Acesse a URL gerada para utilizar a interface de gerenciamento.

## 👥 Créditos

* Desenvolvimento e Concepção: Desenvolvido no âmbito do projeto de extensão Tech SIPrepare ligado ao Instituto Federal de Minas Gerais (IFMG).