// Importar módulo express
const express = require('express');

// Importar módulo fileupload
const fileupload = require('express-fileupload');

// Importar módulo express-handlebars
const{ engine } = require('express-handlebars');

// Importar módulo mysql
const mysql = require('mysql2');

// File Systems
const fs = require('fs');

// App
const app = express ();

// Habilitando o upload de arquivos
app.use(fileupload());

// Adicionar Bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// Adicionar CSS
app.use('/css' , express.static('./css'));

// Referenciar a pasta de imagens
app.use('/imagens', express.static('./imagens'));

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

// Teste de conexão MySQL
conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão MySQL criada com sucesso!');
});

// Rota Principal
app.get('/', function(req, res){
    // SQL
    let sql = 'SELECT*FROM produtos';

    //Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno});
    });
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

// Rota para remover produtos
const path = require('path');

app.get('/remover/:codigo&:imagem', function (req, res) {
    let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;

    conexao.query(sql, function (erro, retorno) {
        if (erro) {
            console.error('Erro ao deletar produto do banco de dados:', erro);
            return res.send('Erro ao deletar produto.');
        }

        let nomeImagem = req.params.imagem.trim(); // Remove espaços extras
        let caminhoImagem = path.join(__dirname, 'imagens', nomeImagem);

        console.log('Tentando remover a imagem:', caminhoImagem);

        fs.access(caminhoImagem, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Imagem não encontrada ou já removida:', caminhoImagem);
                return res.redirect('/'); 
            }

            fs.unlink(caminhoImagem, (erro_imagem) => {
                if (erro_imagem) {
                    console.error('Erro ao remover a imagem:', erro_imagem.message);
                    return res.send('Erro ao remover a imagem: ' + erro_imagem.message);
                } else {
                    console.log('Imagem removida com sucesso!');
                }
                res.redirect('/');
            });
        });
    });
});

// Servidor
app.listen(8080);