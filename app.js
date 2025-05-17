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

// Rota de Busca
app.get('/buscar', function(req, res) {
    const termo = req.query.q;

    if (!termo) {
        return res.redirect('/');
    }

    const sql = `SELECT * FROM produtos WHERE nome LIKE ?`;
    const valores = [`%${termo}%`];

    conexao.query(sql, valores, function(erro, retorno) {
        if (erro) throw erro;

        res.render('formulario', {
            produtos: retorno,
            busca: termo
        });
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

// Rota para redirecionar para o formulário de alteração/edição
app.get('/formularioEditar/:codigo', function(req, res){
    
    // SQL
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;

    // Executar o comando SQL
    conexao.query(sql, function(erro, retorno){
        // Caso haja falha no comando SQL
        if(erro) throw erro;

        // Caso consiga executar o comando SQL
        res.render('formularioEditar', {produto:retorno[0]});
    });
});

// Rota para editar produtos
app.post('/editar', function(req, res) {
    console.log('🟡 Dados recebidos:');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('Imagem enviada:', req.files ? req.files.imagem : 'Nenhuma imagem enviada');

    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagemAntiga = req.body.nomeImagem;

    let sql;
    let imagemFinal;

    // Verifica se o usuário enviou uma nova imagem
    if (req.files && req.files.imagem) {
        let imagemNova = req.files.imagem.name;
        imagemFinal = imagemNova;

        // Move nova imagem para pasta
        req.files.imagem.mv(__dirname + '/imagens/' + imagemNova, function(err) {
            if (err) console.log("Erro ao mover nova imagem: " + err.message);
        });

        // Remove imagem antiga
        const caminhoAntigo = path.join(__dirname, 'imagens', nomeImagemAntiga);
        fs.unlink(caminhoAntigo, function(err) {
            if (err) console.log("Erro ao remover imagem antiga: " + err.message);
            else console.log("Imagem antiga removida com sucesso.");
        });

        // SQL para atualizar com nova imagem
        sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${imagemNova}' WHERE codigo=${codigo}`;
    } else {
        imagemFinal = nomeImagemAntiga;

        // SQL para atualizar mantendo a imagem
        sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;
    }

    // Executar comando SQL
    conexao.query(sql, function(erro, retorno) {
        if (erro) throw erro;
        res.redirect('/');
    });
});

// Servidor
app.listen(8080);