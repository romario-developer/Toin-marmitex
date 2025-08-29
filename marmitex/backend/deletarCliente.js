const mongoose = require('mongoose');
const Cliente = require('./models/Cliente');
require('dotenv').config();

async function deletarCliente() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marmitex');
    console.log('Conectado ao MongoDB');

    // Buscar e exibir clientes existentes
    const clientes = await Cliente.find({}, 'email nome');
    console.log('\nClientes encontrados:');
    clientes.forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nome} - ${cliente.email}`);
    });

    if (clientes.length === 0) {
      console.log('Nenhum cliente encontrado.');
      return;
    }

    // Para deletar um cliente específico, descomente e modifique a linha abaixo:
    // const emailParaDeletar = 'romariotecla@icloud.com';
    
    // Exemplo: deletar cliente por email
    // const resultado = await Cliente.deleteOne({ email: emailParaDeletar });
    // console.log(`\nCliente deletado:`, resultado);
    
    console.log('\n--- INSTRUÇÕES ---');
    console.log('Para deletar um cliente específico:');
    console.log('1. Descomente a linha: const emailParaDeletar = \'email@exemplo.com\';');
    console.log('2. Substitua pelo email do cliente que deseja deletar');
    console.log('3. Descomente as linhas de deleteOne');
    console.log('4. Execute novamente: node deletarCliente.js');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexão fechada.');
  }
}

deletarCliente();