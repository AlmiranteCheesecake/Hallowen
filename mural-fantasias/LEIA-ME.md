# Mural das Fantasias

Site simples: index.html (a página) + api/fantasias.js (fala com o banco Neon).
A tabela é criada sozinha na primeira visita — não precisa rodar SQL.

## Publicar (tudo pelo navegador, grátis)

1. GitHub: crie um repositório novo (pode ser privado) e use "Add file > Upload files"
   para subir index.html, package.json e a pasta api/ (com o fantasias.js dentro).
2. Vercel (vercel.com, entre com o GitHub): "Add New > Project", importe o repositório
   e clique em Deploy. Framework: "Other". Não precisa mudar nada.
3. No projeto da Vercel, aba "Storage" > "Create Database" > Neon > aceite e conecte ao projeto.
   Isso cria a variável DATABASE_URL automaticamente.
   (Se já tem um banco no Neon: Settings > Environment Variables > DATABASE_URL = sua connection string.)
4. Aba "Deployments" > nos três pontinhos do último deploy > "Redeploy"
   (para o site enxergar o banco).
5. Abra o endereço .vercel.app e mande no grupo. Ninguém precisa de login.

## Como funciona
- Fantasia repetida é bloqueada no banco: "O Vampiro", "vampiro" e "Vampíro" contam como a mesma.
- Cada navegador fica com uma fantasia; reservar outra troca a anterior.
- "Liberar minha fantasia" só funciona no mesmo celular/navegador em que a pessoa reservou.
- A lista atualiza sozinha a cada 5 segundos.

## Zerar o mural
No Neon, SQL Editor: DELETE FROM fantasias;
