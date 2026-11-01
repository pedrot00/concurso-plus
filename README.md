# Concurso+ 3.0

Sistema de gerenciamento de estudos para concursos públicos, feito em **HTML, CSS e JavaScript**, com persistência **em arquivo JavaScript local (`Data/dados.js`)**, sem banco de dados e sem dependências npm de terceiros.

## IMPORTANTE — forma correta de executar

**Esta versão NÃO deve ser aberta pelo Live Server e NÃO deve ser executada diretamente pelo `index.html`.** Navegadores não têm permissão para regravar arquivos `.js` locais. Por esse motivo, o projeto inclui um servidor Node.js mínimo que serve as páginas e grava o arquivo automaticamente.

### Windows (VS Code ou terminal)

1. Instale **Node.js 18 ou superior** (recomenda-se uma versão LTS atual).
2. Extraia o ZIP. Abra a pasta **ConcursoPlus** no VS Code ou no Explorador.
3. Dê um duplo clique em **`iniciar.bat`** ou abra um terminal nessa pasta e execute:

   ```bash
   npm start
   ```

4. Abra no navegador: **http://127.0.0.1:3100**.
5. Deixe a janela do terminal aberta enquanto estiver utilizando o aplicativo.

Não é necessário executar `npm install`, pois todas as dependências são nativas do Node.js. O aplicativo só escuta o endereço local `127.0.0.1`.

No Linux/macOS, abra um terminal na pasta do projeto e execute `npm start`.

## Onde os dados são armazenados?

```
ConcursoPlus/
├── Data/
│   ├── dados.js                   ← todos os grupos, conteúdos, registros, revisões e tema
│   └── dados-anteriores.js        ← backup automático do estado anterior (após o primeiro salvamento)
├── Pages/
│   ├── registros.html
│   └── estatisticas.html
├── Style/
│   ├── base.css
│   ├── registros.css
│   ├── estatisticas.css
│   └── polish.css
├── Scripts/
│   ├── store.js                   ← validação, controle e chamadas à API local
│   ├── utils.js
│   ├── ui.js
│   ├── registros.js
│   └── estatisticas.js
├── tests/
├── server.js                     ← servidor local e gravação atômica
├── package.json
├── iniciar.bat
├── index.html
└── README.md
```

**Ao criar, atualizar ou excluir qualquer informação, os dados são salvos em `Data/dados.js`.** Esse arquivo é um objeto JavaScript serializado em texto; não há SQLite, IndexedDB ou `localStorage` para armazenar dados do usuário. A preferência de tema também é salva nele. Os dados permanecem após fechar o navegador ou reiniciar o computador, desde que a pasta e o arquivo sejam preservados.

**Portabilidade:** copie a pasta `ConcursoPlus` inteira (ou no mínimo seu código e `Data/dados.js`) para outro computador com Node.js. Execute `npm start` e os dados estarão disponíveis. Não compartilhe o arquivo `Data/dados.js` publicamente se contiver informações que deseja manter privadas.

**Proteção contra perdas:** a aplicação valida registros no frontend e no servidor, grava em arquivo temporário e renomeia-o ao final (gravação atômica). Em cada salvamento, mantém também uma cópia da versão anterior em `Data/dados-anteriores.js`. Além disso, há a função **Dados e backup → Exportar backup** que gera um arquivo JSON manual para guardar em outro local. Backups automáticos não substituem cópias externas.

## Migrar dados do Concurso+ anterior (localStorage)

A versão 2.0 guardava as informações no navegador. A versão 3.0 passa a gravar em arquivo e **não consegue acessar automaticamente** o armazenamento de outra origem/porta (ex.: `localhost:5500` do Live Server). Para preservar seus dados, **não apague a versão anterior antes de concluir a migração**.

1. Abra a versão antiga **no mesmo navegador e endereço usados anteriormente**.
2. Entre em **Dados e backup → Exportar backup**. Guarde o JSON.
3. Inicie a versão 3.0 por `npm start` e acesse `http://127.0.0.1:3100`.
4. Entre em **Dados e backup → Importar backup** e selecione o JSON exportado.
5. Confirme que os indicadores e registros reapareceram e que o arquivo `Data/dados.js` foi atualizado.

O menu também oferece uma tentativa de migração direta do `localStorage`, mas **ela só funciona caso os dados antigos estejam armazenados na mesma origem**. Em caso de dúvida, prefira o procedimento por exportação/importação JSON.

## Funcionalidades

### Registros

- Criar, editar e excluir grupos, conteúdos e registros, com validação de valores e prioridades.
- Cores específicas por grupo, revisão de notas e ícone ao lado da data que **mostra as notas ao passar o mouse**, sem clique. Para acessibilidade, também funciona por foco do teclado.
- Indicadores de sessões, horas, questões, acertos, erros e taxa de desempenho.
- Revisões realizadas e lembretes futuros, organizados antes de conteúdos por grupo; grupos expansíveis.
- Lembretes são independentes dos registros: marcá-los como realizados só exclui o lembrete, sem inflar as estatísticas.
- Layout em colunas quando há espaço suficiente, com rolagem horizontal somente nas tabelas mais amplas.

### Estatísticas

- Calendário navegável por mês: cada dia tem cor do grupo com mais tempo de estudo, intensificada acima de quatro horas. O tempo total aparece em destaque na célula.
- Ao selecionar uma data no calendário, são exibidas **todas as sessões do dia**: grupo, conteúdo, banca, tipo, tempo, número de questões, acertos, percentual e anotação.
- Gráfico de duas linhas suaves: **verde** para questões e **vermelho** para horas, com eixo X fixo de **outubro/2026 a fevereiro/2028** (17 meses). Cada indicador usa sua escala vertical própria.
- Gráficos de rosca para acertos/erros e distribuição das horas por grupo; gráficos de colunas para horários e desempenho por conteúdo, e para distribuição semanal.
- Barras comparativas para erros, taxa de desempenho, conteúdos estudados, frequência e necessidade de revisão.
- Indicadores de revisões calculados exclusivamente a partir de registros do tipo `Revisão`, não de lembretes futuros.
- Todos os gráficos são derivados das sessões efetivamente salvas, sem percentuais inventados.

## Dados demonstrativos

O arquivo distribuído vem com **três grupos, seis conteúdos e sete sessões de demonstração**. Esses dados podem ser editados, excluídos ou apagados em **Dados e backup → Limpar todos os dados**. Faça backup antes de substituir dados que queira preservar.

## Desenvolvimento e testes

Para executar os testes automatizados de servidor, renderização dos gráficos e persistência, use:

```bash
npm test
```

Os testes usam uma cópia isolada dos dados de exemplo, **sem modificar `Data/dados.js` do usuário**.

## Observações

- Não feche o terminal do servidor enquanto estiver usando a aplicação.
- Para mudar a porta, configure a variável de ambiente `PORT` antes de executar o servidor, e então use o endereço com essa porta.
- Caso abra simultaneamente duas abas antigas, o controle de revisão da gravação evita que uma sobrescreva silenciosamente as alterações da outra. Se surgir um aviso de conflito, recarregue a página.
- Esta aplicação é local e individual. Não há autenticação e o servidor não deve ser disponibilizado na Internet.

## Página Estatísticas redesenhada (novembro de 2026)

A página `Pages/estatisticas.html` utiliza `Scripts/estatisticas.js` e `Style/estatisticas-redesign.css` para apresentar gráficos compactos, rankings de desempenho, distribuição de estudo por grupos e calendário com cor personalizável. No calendário, registros com menos de três horas recebem cor suave; de três a quatro horas, cor acentuada; mais de quatro horas, borda destacada.

**Dados incluídos:** esta distribuição vem preenchida com 240 registros fictícios para demonstrar os gráficos e filtros. Os dados ficam em `Data/dados.js`; faça backup antes de substituir por dados reais. O servidor gerencia esse arquivo enquanto estiver em execução, portanto evite editá-lo pelo VS Code com o servidor aberto.
