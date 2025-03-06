// Importar módulo express
const express = require('express');

// Importar módulo fileupload
const fileupload = require('express-fileupload');

// Importar módulo express-handlebars
const{ engine } = require('express-handlebars');

// Importar módulo mysql
const mysql = require('mysql2');

// App
const app = express ();

// Habilitando o upload de arquivos
app.use(fileupload());

// Adicionar Bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// Adicionar CSS
app.use('/css' , express.static('./css'));

// Configuração do express-handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Configuração de conexão
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'Semog1998!',
    database:'projeto'
});

// Teste de conexão
conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão criada com sucesso!');
});

// Rota Principal
app.get('/', function(req, res){
    res.render('formulario');
});

// Rota de cadastro
app.post('/cadastrar', function(req, res){
    // Obter os dados que serão utilizados para o cadastro
    let nome = req.body.nome;
    let valor = req.body.valor;
    let imagem = req.files.imagem.name;

    // SQL
    let sql = `INSERT INTO produtos(nome, valor, imagem) VALUES ('${nome}', ${valor}, '${imagem}')`;

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso ocorra algum erro
        if(erro) throw erro;

        // Caso ocorra o cadastro
        req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name);
        console.log(retorno);
    });

    // Retornar para a rota principal
    res.redirect('/');
});

// Servidor
app.listen(8080);