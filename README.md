# ⚡ Cavaleiros do Zodíaco - Algoritmo A* ⚡

Este projeto é um **programa web interativo** que simula a jornada dos Cavaleiros de Bronze pelas 12 Casas do Zodíaco para salvar Atena.  
Ele foi desenvolvido como **Trabalho 1** da disciplina **Inteligência Artificial e Computacional** (IFTM - Campus Patrocínio) e tem **fins exclusivamente acadêmicos**.

---

## 🏫 Dados Acadêmicos

- **Instituição:** Instituto Federal do Triângulo Mineiro (IFTM) – Campus Patrocínio  
- **Curso:** Análise e Desenvolvimento de Sistemas – 6º Período  
- **Disciplina:** Inteligência Artificial e Computacional  
- **Docente:** Profa. Dra. Danielli Araújo Lima  
- **Discente:** João Augusto Marciano Silva  

---

## 📚 Contexto do Trabalho

De acordo com o enunciado do trabalho, a missão é ajudar os Cavaleiros de Bronze (**Seiya, Shiryu, Hyoga, Shun e Ikki**) a atravessarem as 12 Casas do Zodíaco e derrotarem os Cavaleiros de Ouro, utilizando o **algoritmo de busca heurística A\***.  

O desafio envolve:
- Encontrar o caminho mais eficiente no mapa (matriz 42x42).
- Planejar batalhas contra os Cavaleiros de Ouro levando em conta **poder cósmico** e **energia** dos Cavaleiros de Bronze.
- Considerar o **custo do terreno** (montanhoso, plano e rochoso).
- Exibir o tempo total gasto até alcançar a Casa do Grande Mestre.

---

## 🕹️ Funcionamento do Programa

O sistema foi implementado em **HTML, CSS e JavaScript** e roda diretamente no navegador, sem necessidade de back-end.

### 🔑 Funcionalidades principais
- **Mapa 42x42**: Grelha representando o Santuário e as 12 Casas do Zodíaco.
- **Terrenos configuráveis**: Cada célula pode ser alterada clicando (Plano → Rochoso → Montanhoso).
- **Algoritmo A\***: Cálculo automático do caminho mais curto atravessando todas as casas.
- **Simulação de batalhas**:  
  - Cada Casa tem um nível de dificuldade.  
  - Cavaleiros possuem poder cósmico e pontos de energia.  
  - O tempo de batalha é calculado pela fórmula:  
    ```
    Tempo = Dificuldade da Casa / Σ Poder dos Cavaleiros em batalha
    ```
- **Interface gráfica interativa**:
  - Mostra o progresso dos Cavaleiros no mapa.  
  - Permite ajustar manualmente o poder cósmico e a dificuldade das Casas.  
  - Exibe em tempo real: tempo total, cavaleiros vivos e casas concluídas.  
- **Resultados finais**: Ao final da simulação, é exibido se Atena foi salva ou se a missão falhou.

---

## 🚀 Como Executar

Para acessar o programa você pode simplesmente entrar no site [https://joaomarcianodev.github.io/IAC-Trab1](https://joaomarcianodev.github.io/IAC-Trab1) ou seguir os seguintes passos para rodar localmente:
1. Clone ou baixe este repositório.
2. Abra o arquivo `index.html` diretamente em seu navegador.
3. Utilize os botões da interface:
   - 🔍 **Calcular Caminho** → Executa o algoritmo A* para planejar a rota.  
   - ▶️ **Iniciar Simulação** → Inicia a jornada dos Cavaleiros.  
   - 🔄 **Resetar Jogo** → Reinicia a simulação.  
   - 🗺️ **Gerar Novo Mapa** → Cria um novo mapa aleatório.  
   - 👨‍💻 **Sobre Nós** → Exibe informações sobre o desenvolvedor.  

---

## 🎨 Tecnologias Utilizadas

- **HTML5** para a estrutura da página.  
- **CSS3** (com Gradientes, Flexbox e Grid) para layout e design.  
- **JavaScript (ES6+)** para lógica do jogo, simulação e algoritmo A*.  
- **Bootstrap 5** e **Font Awesome** para componentes visuais e ícones.  
- **jQuery** para manipulação da DOM e modais.

---

## 📖 Observações Importantes

- Este projeto **não é comercial**.  
- Foi desenvolvido exclusivamente para fins acadêmicos como parte da avaliação da disciplina **Inteligência Artificial e Computacional**.  
- A narrativa e personagens são inspirados na obra *Cavaleiros do Zodíaco*, utilizada aqui apenas para **contextualização didática**.

---

## 👨‍💻 Desenvolvedor

**João Augusto Marciano Silva**  
- ✉️ joaoaugustoptc2020@gmail.com  
- ✉️ joao.silva@estudante.iftm.edu.br  
- 🔗 [GitHub](https://github.com/joaomarcianodev)  
- 🔗 [LinkedIn](https://www.linkedin.com/in/joao-augusto-marciano-silva)  
- 📸 [Instagram](https://instagram.com/jams2307)
