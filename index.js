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

//ROTA PARA ATUALIZAR O HISTÓRICO DE PEDIDOS DO USUÁRIO
app.put("/add-historico", async (req, res) => {
    // PEGA OS DADOS DA REQUISIÇÃO
    const { userId, pedido } = req.body;

    // VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!userId) {
        return res.send("informe o ID do usuário");
    }

    // VERIFICA SE OS CAMPOS FORAM PASSADOS
    if (!pedido) {
        return res.send("informe o pedido a ser adicionado");
    }

    try {
        // PROCURA O USUÁRIO PELO ID
        const person = await Person.findById(userId);

        // VERIFICA SE O USUÁRIO EXISTE
        if (!person) {
            return res.send("usuário não encontrado");
        }

        // ADICIONA O NOVO PEDIDO AO ARRAY DE HISTÓRICO DE PEDIDOS
        person.historico_pedido.push(pedido);

        // SALVA AS ALTERAÇÕES NO BANCO DE DADOS
        await person.save();

        // RETORNA OS DADOS ATUALIZADOS
        return res.send({ message: "Pedido adicionado com sucesso", historico_pedido: person.historico_pedido });
    } catch (error) {
        // RETORNA MENSAGEM DE ERRO SE HOUVER PROBLEMAS
        return res.status(500).send("Erro ao adicionar pedido");
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
        type: String,
        required: false
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: false
    }
});

//ROTA DE REGISTRO FEITA PARA REGISTRAR PRODUTO
app.post("/product/register", async (req, res) => {
    //PEGA OS DADOS DA REQUISIÇÃO
    const name = req.body.name
    const category = req.body.category
    const price = req.body.price

    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!name){
        res.send("Nome não correspondente.")
        return
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!category){
        res.send("Categoria não correspondente.")
        return
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!price){
        res.send("Senha não correspondente.")
        return
    }

    //CRIA UM NOVO USUÁRIO COM BASE NO BANCO DE DADOS
    const product = new Product({
        name: name,
        category: category,
        price: price,
    })

    //SALVA NO BANCO DE DADOS O USUÁRIO
    await product.save()

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(product)
})

//ROTA PARA PEGAR TODOS OS PRODUTO
app.get("/products", async (req, res) => {
    //LISTA TODOS OS PRODUTOS DO BANCO DE DADOS
    const products = await Product.find()

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(products)
})

//ROTA PARA PEGAR PRODUTO ESPECIFICO
app.get("/product/:name",  async (req, res) => {
    //PEGA OS DADOS PELA REQUISIÇÃO
    const name = req.params.name

    //PROCURA POR UM PRODUTO COM O CAMPO ESPECIFICADO
    const person = await Person.findOne({ name: name })

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(person)
})

//MODELO DO OBJETO DO BANCO DE DADOS
const Order = mongoose.model('Order', {
    client_name: {
        type: String,
        required: false
    },
    client_address: {
        type: String,
        required: false
    },
    payment_mode: {
        type: String,
        required: false
    },
    data: {
        type: String,
        required: true
    },
    print: {
        type: String,
        required: false
    }
});

//ROTA PARA PEGAR TODOS OS PEDIDOS
app.get("/orders", async (req, res) => {
    //LISTA TODOS OS PEDIDOS DOS USUÁRIOS DO BANCO DE DADOS
    const order = await Order.find()

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(order)
})

//ROTA PARA PEGAR PEDIDO ESPECIFICO
app.get("/order/:client_name",  async (req, res) => {
    //PEGA OS DADOS PELA REQUISIÇÃO
    const client_name = req.params.client_name

    //PROCURA PELOS PEDIDOS DOCLIENTE COM O CAMPO ESPECIFICADO
    const order = await Order.findOne({ client_name: client_name })

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(order)
})

//ROTA DE REGISTRO FEITA PARA REGISTRAR PEDIDO
app.post("/order/register", async (req, res) => {
    //PEGA OS DADOS DA REQUISIÇÃO
    const client_name = req.body.client_name
    const client_address = req.body.client_address
    const payment_mode = req.body.payment_mode
    const data = req.body.data
    const print = req.body.print

    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!client_name){
        res.send("Nome não correspondente.")
        return
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!client_address){
        res.send("Endereço não correspondente.")
        return
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!payment_mode){
        res.send("Modo de pagamento não correspondente.")
        return
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!data){
        res.send("Data não correspondente.")
        return
    }
    //VERIFICA SE OS CAMPOS FORAM PASSADOS OU NÃO
    if (!print){
        res.send("Estampa não correspondente.")
        return
    }

    //CRIA UM NOVO PEDIDO COM BASE NO BANCO DE DADOS
    const order = new Order({
        client_name: client_name,
        client_address: client_address,
        payment_mode: payment_mode,
        data: data,
        print: print,
    })

    //SALVA NO BANCO DE DADOS O USUÁRIO
    await order.save()

    //RETORNA OS DADOS PARA FEEDBACK DO USUÁRIO
    return res.send(order)
})


app.post('/person/:id/pedido', async (req, res) => {
    const personId = req.params.id;
    const { item, quantidade, complemento } = req.body; // Desestruturação dos dados da requisição

    try {
        // Encontra a pessoa pelo ID
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        // Verifique se o campo complemento foi enviado e atualize se necessário
        if (complemento) {
            person.complemento = complemento;
        } else if (!person.complemento) {
            return res.status(400).json({ error: 'Campo `complemento` é obrigatório' });
        }

        // Adiciona o novo pedido ao array historico_pedido
        person.historico_pedido.push({ item, quantidade });

        // Salva a pessoa atualizada no banco de dados
        await person.save();

        res.status(200).json({ message: 'Pedido adicionado ao histórico', person });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar pedido', details: error });
    }
});
app.listen(port, () => {
    mongoose.connect(`mongodb+srv://${user_name}:${password}@bdpresente.fttzn1n.mongodb.net/?retryWrites=true&w=majority&appName=bdpresente`)
    console.log(`rodando no ${port} `)
})