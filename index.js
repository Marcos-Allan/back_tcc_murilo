//IMPORTAÇÃO DAS BIBLIOTECAS
const express = require("express")
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())
const port = 3000

//CONFIGURAÇÕES DO MONGODB
const user_name = 'TCC'
const password = 'f8XFhMUQUUd4AaEV'

//MODELO DO OBJETO DO BANCO DE DADOS
const Person = mongoose.model('Person', {
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    login_type: {
        type: String,
        required: false,
        default: 'local',
    },
    cart: {
        type: [],
        required: false
    },
    cep: {
        type: String,
        required: false
    },
    numero: {
        type: String,
        required: false
    },
    complemento: {
        type: String,
        required: false
    },
    historico_pedido: {
        type: Array,
        required: false
    }
});

//ROTA PARA PEGAR TODOS OS USUÁRIOS
app.get("/users", async (req, res) => {
    //LISTA TODOS OS USUÁRIOS DO BANCO DE DADOS
    const person = await Person.find()

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(person)
})

//ROTA PARA PEGAR USUÁRIO ESPECIFICO
app.post("/login",  async (req, res) => {
    //PEGA OS DADOS PELA REQUISIÇÃO
    const email = req.body.email
    const password = req.body.password

    //VERIFICA SE O CAMPO FOI PASSADO
    if(!email){
        //RETORNA MENSAGEM DE ERRO
        return res.send('informe um email')
    }
    
    //VERIFICA SE O CAMPO FOI PASSADO
    if(!password){
        //RETORNA MENSAGEM DE ERRO
        return res.send('informe uma senha')
    }

    //PROCURA POR UM USUARIO COM O CAMPO ESPECIFICADO
    const person = await Person.findOne({ email: email })

    //VERIFICA SE O USUÁRIO EXISTE NO BD
    if(!person){
        //RETORNA MENSAGEM DE ERRO
        return res.send('usuário não cadasrtrado')
    }else{
        if(person.login_type == 'local'){
            if(password == person.password){    
                //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
                return res.send(person)
            }else{
                //RETORNA MENSAGEM DE ERRO
                return res.send('senha incorreta')
            }
        }else{
            //RETORNA MENSAGEM DE ERRO
            return res.send('conta cadastrada com o google')
        }
    }
})

//ROTA DE REGISTRO FEITA PARA REGISTRAR CLIENTE
app.post("/register", async (req, res) => {
    //PEGA OS DADOS DA REQUISIÇÃO
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password

    //VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!name){
        //RETORNA MENSAGEM DE ERRO
        return res.send("informe um nome")
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!email){
        //RETORNA MENSAGEM DE ERRO
        return res.send("informe um email")
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!password){
        //RETORNA MENSAGEM DE ERRO
        return res.send("informe uma senha")
    }

    //PROCURA POR UM USUARIO COM O CAMPO ESPECIFICADO
    const personExist = await Person.findOne({ email: email })

    if(personExist){
        //RETORNA MENSAGEM DE ERRO
        return res.send("usuário já cadastrado com esse email")
    }else{
        //CRIA UM NOVO USUÁRIO COM BASE NO BANCO DE DADOS
        const person = new Person({
            name: name,
            email: email,
            password: password,
        })
    
        //SALVA NO BANCO DE DADOS O USUÁRIO
        await person.save()
    
        //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
        return res.send(person)
    }
})

//ROTA DE REGISTRO FEITA PARA REGISTRAR CLIENTE
app.post("/register-google", async (req, res) => {
    //PEGA OS DADOS DA REQUISIÇÃO
    const name = req.body.name
    const email = req.body.email
    const login_type =  'google'

    //VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!name){
        //RETORNA MENSAGEM DE ERRO
        return res.send("informe um nome")
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!email){
        //RETORNA MENSAGEM DE ERRO
        return res.send("informe um email")
    }

    //PROCURA POR UM USUARIO COM O CAMPO ESPECIFICADO
    const personExist = await Person.findOne({ email: email })

    if(personExist){
        //RETORNA MENSAGEM USUÁRIO
        return res.send({person: personExist, message: 'Bem vindo novamente'})
    }else{
        //CRIA UM NOVO USUÁRIO COM BASE NO BANCO DE DADOS
        const person = new Person({
            name: name,
            email: email,
            login_type: login_type
        })
    
        //SALVA NO BANCO DE DADOS O USUÁRIO
        await person.save()
    
        //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
        return res.send({person: person, message: 'Seja muito bem vindo'})
    }
})

//ROTA PARA FINALIZAR COMPRA E MOVER PEDIDOS PARA O HISTÓRICO
app.post("/finalizar-compra", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send("informe o ID do usuário");
    }

    try {
        const person = await Person.findById(userId);

        if (!person) {
            return res.status(404).send("usuário não encontrado");
        }

        if (person.cart.length === 0) {
            return res.status(400).send("carrinho vazio");
        }

        // Move os itens do carrinho para o histórico de pedidos e limpa o carrinho
        person.historico_pedido = [...person.historico_pedido, ...person.cart];
        person.cart = [];

        await person.save();
        return res.status(200).send({
            message: "Compra finalizada e adicionada ao histórico com sucesso",
            historico_pedido: person.historico_pedido,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Erro ao finalizar compra");
    }
});

// ROTA PARA ADICIONAR ITEM AO CARRINHO
app.put("/add-carrinho", async (req, res) => {
    const { userId, produto } = req.body;

    if (!userId) {
        return res.status(400).send("informe o ID do usuário");
    }

    if (!produto) {
        return res.status(400).send("informe o produto a ser adicionado");
    }

    try {
        const person = await Person.findById(userId);

        if (!person) {
            return res.status(404).send("usuário não encontrado");
        }

        person.cart.push(produto);
        await person.save();

        return res.status(200).send({
            message: "Produto adicionado ao carrinho",
            cart: person.cart,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Erro ao adicionar produto ao carrinho");
    }
});

// ROTA PARA ATUALIZAR UM ITEM NO CARRINHO
app.put("/update-carrinho", async (req, res) => {
    const { userId, itemId, novosDados } = req.body;

    // Verifica se os campos foram passados
    if (!userId) {
        return res.status(400).send("Informe o ID do usuário");
    }

    if (!itemId) {
        return res.status(400).send("Informe o ID do item a ser atualizado");
    }

    if (!novosDados) {
        return res.status(400).send("Informe os novos dados do item");
    }

    try {
        // Busca o usuário pelo ID
        const person = await Person.findById(userId);

        if (!person) {
            return res.status(404).send("Usuário não encontrado");
        }

        // Encontra o índice do item no carrinho
        const itemIndex = person.cart.findIndex((item) => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).send("Item não encontrado no carrinho");
        }

        // Atualiza o item no carrinho com os novos dados
        person.cart[itemIndex] = { 
            ...person.cart[itemIndex], 
            ...novosDados 
        };

        // Salva as alterações no banco de dados
        await person.save();

        // Retorna os dados atualizados
        return res.status(200).send({
            message: "Item atualizado no carrinho com sucesso",
            cart: person.cart,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Erro ao atualizar item no carrinho");
    }
});

//ROTA PARA REMOVER UM ITEM DO CARRINHO
app.delete("/remove-carrinho", async (req, res) => {
    const { userId, itemId } = req.body;

    // Verifica se os campos foram passados
    if (!userId) {
        return res.status(400).send("Informe o ID do usuário");
    }

    if (!itemId) {
        return res.status(400).send("Informe o ID do item a ser removido");
    }

    try {
        // Busca o usuário pelo ID
        const person = await Person.findById(userId);

        // Verifica se o usuário existe
        if (!person) {
            return res.status(404).send("Usuário não encontrado");
        }

        // Filtra o carrinho para remover o item com o ID especificado
        const updatedCart = person.cart.filter(item => item.id !== itemId);

        // Verifica se o item existia no carrinho
        if (updatedCart.length === person.cart.length) {
            return res.status(404).send("Item não encontrado no carrinho");
        }

        // Atualiza o carrinho do usuário e salva no banco de dados
        person.cart = updatedCart;
        await person.save();

        // Retorna o carrinho atualizado
        return res.status(200).send({
            message: "Item removido do carrinho com sucesso",
            cart: person.cart,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Erro ao remover item do carrinho");
    }
});

// ROTA PARA ATUALIZAR UM PEDIDO ESPECÍFICO NO HISTÓRICO DE PEDIDOS DO USUÁRIO
app.put("/update-historico", async (req, res) => {
    // PEGA OS DADOS DA REQUISIÇÃO
    const { userId, pedidoId, novosDados } = req.body;

    // VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!userId) {
        return res.status(400).send({ error: "Informe o ID do usuário" });
    }

    if (!pedidoId) {
        return res.status(400).send({ error: "Informe o ID do pedido a ser atualizado" });
    }

    if (!novosDados) {
        return res.status(400).send({ error: "Informe os novos dados do pedido" });
    }

    try {
        // PROCURA O USUÁRIO PELO ID
        const person = await Person.findById(userId);

        // VERIFICA SE O USUÁRIO EXISTE
        if (!person) {
            return res.status(404).send({ error: "Usuário não encontrado" });
        }

        // ENCONTRA O ÍNDICE DO PEDIDO NO HISTÓRICO
        const pedidoIndex = person.historico_pedido.findIndex(p => p.id === pedidoId);

        // VERIFICA SE O PEDIDO FOI ENCONTRADO
        if (pedidoIndex === -1) {
            return res.status(404).send({ error: "Pedido não encontrado no histórico" });
        }

        // ATUALIZA APENAS O PEDIDO ESPECÍFICO COM OS NOVOS DADOS
        person.historico_pedido[pedidoIndex] = { 
            ...person.historico_pedido[pedidoIndex], 
            ...novosDados 
        };

        // SALVA AS ALTERAÇÕES NO BANCO DE DADOS
        await person.save();

        // RETORNA OS DADOS ATUALIZADOS
        return res.status(200).send({
            message: "Pedido atualizado com sucesso",
            historico_pedido: person.historico_pedido
        });
    } catch (error) {
        // RETORNA MENSAGEM DE ERRO SE HOUVER PROBLEMAS
        console.error(error);
        return res.status(500).send({ error: "Erro ao atualizar pedido" });
    }
});

//MODELO DO OBJETO DO BANCO DE DADOS
const Product = mongoose.model('Product', {
    name: {
        type: String,       // CAMPO DO TIPO STRING
        required: true      // DEFINE QUE O CAMPO É OBRIGATÓRIO
      },
      img: {
        type: [String],     // ARRAY DE STRINGS PARA ARMAZENAR VÁRIAS URLS DE IMAGENS
        required: true      // DEFINE QUE O CAMPO É OBRIGATÓRIO
      },
      type: {
        type: [String],     // ARRAY DE STRINGS
        required: true
      },
      colors: {
        type: [[String]],   // ARRAY DE ARRAYS DE STRINGS
        required: true
      },
      prices: {
        type: [String],     // ARRAY DE STRINGS
        required: true
      }
});

app.post('/add-product', async (req, res) => {
    try {
      // CRIA UM NOVO DOCUMENTO USANDO OS DADOS DO CORPO DA REQUISIÇÃO
      const newMaterial = new Product({
        name: req.body.materials.name,         // DEFINE O NOME DO MATERIAL
        img: req.body.materials.img,           // DEFINE O ARRAY DE URLS DAS IMAGENS
        type: req.body.materials.type,         // DEFINE OS TIPOS
        colors: req.body.materials.colors,     // DEFINE AS CORES
        prices: req.body.materials.prices      // DEFINE OS PREÇOS
      });
  
      // SALVA O NOVO DOCUMENTO NO BANCO DE DADOS
      const savedMaterial = await newMaterial.save();
  
      // RETORNA UMA RESPOSTA DE SUCESSO
      res.status(201).json(savedMaterial);
    } catch (error) {
      // EM CASO DE ERRO, RETORNA UMA MENSAGEM DE ERRO
      res.status(400).json({ message: error.message });
    }
});

app.get('/all-products', async (req, res) => {
    try {
      // USA O MÉTODO find() PARA BUSCAR TODOS OS DOCUMENTOS
      const materials = await Product.find();
  
      // RETORNA OS DOCUMENTOS ENCONTRADOS EM FORMATO JSON
      res.status(200).json(materials);
    } catch (error) {
      // EM CASO DE ERRO, RETORNA UMA MENSAGEM DE ERRO
      res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => {
    mongoose.connect(`mongodb+srv://${user_name}:${password}@bdpresente.fttzn1n.mongodb.net/?retryWrites=true&w=majority&appName=bdpresente`)
    console.log(`rodando no ${port} `)
})