const express = require("express");
const { Client } = require('pg');
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyparser.json());

var conString = config.urlConnection;
var client = new Client(conString);

client.connect(function (err) {
  if (err) {
    return console.error('Não foi possível conectar ao banco.', err);
  }
  client.query('SELECT NOW()', function (err, result) {
    if (err) {
      return console.error('Erro ao executar a query.', err);
    }
    console.log(result.rows[0]);
  });
});

app.get("/", (req, res) => {
  console.log("Response ok.");
  res.send("Ok – Servidor disponível.");
});
app.listen(config.port, () =>
  console.log("Servidor funcionando na porta " + config.port)
);

/***************************************************** Rotas para a tabela Cardapio************************************************************/
// READ (GET) - Listar todos os cardápios
app.get("/cardapio", (req, res) => {
  try {
    client.query("SELECT * FROM cardapio", function
      (err, result) {
      if (err) {
        return console.error("Erro ao executar a qry de SELECT", err);
      }
      res.send(result.rows);
      console.log("Rota: get cardapio");
    });
  } catch (error) {
    console.log(error);
  }
});

// READ (GET) - Listar cardápio por ID
app.get("/cardapio/:id", (req, res) => {
  try {
    console.log("Rota: cardapio/" + req.params.id);
    client.query(
      "SELECT * FROM cardapio WHERE id = $1", [req.params.id],
      (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de SELECT id", err);
        }
        res.send(result.rows);
        //console.log(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// DELETE (DELETE) - Excluir cardápio
app.delete("/cardapio/:id", (req, res) => {
  try {
    const cardapioId = req.params.id;
    console.log("Rota: delete/" + cardapioId);

    // Verificar se existem avaliações associadas ao cardápio
    client.query(
      "SELECT COUNT(*) FROM avaliacao WHERE cardapio_id = $1", 
      [cardapioId], 
      (err, result) => {
        if (err) {
          return console.error("Erro ao verificar avaliações", err);
        }

        const avaliacaoCount = parseInt(result.rows[0].count, 10);

        if (avaliacaoCount > 0) {
          // Impedir exclusão caso existam avaliações
          return res.status(400).json({ error: "Não é possível excluir um cardápio que já foi avaliado." });
        }

        // Se não houver avaliações, proceder com a exclusão do cardápio
        client.query(
          "DELETE FROM cardapio WHERE id = $1", 
          [cardapioId], 
          (err, result) => {
            if (err) {
              return console.error("Erro ao executar a query de DELETE", err);
            }

            if (result.rowCount === 0) {
              res.status(404).json({ info: "Registro não encontrado." });
            } else {
              res.status(200).json({ info: "Registro excluído." });
            }
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
});

// CREATE (POST) - Cadastrar cardápio
app.post("/cardapio", (req, res) => {
  try {
    console.log("Alguém enviou um post com os dados:", req.body);
    const { data, refeicao, titulo } = req.body;

    client.query(
      "INSERT INTO cardapio (data, refeicao, titulo) VALUES ($1, $2, $3) RETURNING *", 
      [data, refeicao, titulo],
      (err, result) => {
        if (err) {
          console.error("Erro ao executar a qry de INSERT", err);
          return res.status(500).json({ error: "Erro ao inserir dados no banco" });
        }

        const { id } = result.rows[0];
        res.setHeader("id", `${id}`);
        res.status(201).json(result.rows[0]);
        console.log(result);
      }
    );
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// UPDATE (PUT) - Atualizar cardápio
app.put("/cardapio/:id", (req, res) => {
  try {
    console.log("Alguém enviou um update com os dados:", req.body);
    const id = req.params.id;
    const { data, refeicao, titulo } = req.body;
    client.query(
      "UPDATE cardapio SET data=$1, refeicao=$2, titulo=$3 WHERE id =$4 ",
      [data, refeicao, titulo, id],
      function (err, result) {
        if (err) {
          return console.error("Erro ao executar a qry de UPDATE", err);
        } else {
          res.setHeader("id", id);
          res.status(202).json({ "identificador": id });
          console.log(result);
        }
      }
    );
  } catch (erro) {
    console.error(erro);
  }
});

// READ (GET) ITENS BY CARDAPIO ID - Retorna todos os itens de um cardápio
app.get("/cardapio/:id/itens", (req, res) => {
  try {
    console.log("Rota: cardapio/" + req.params.id + "/itens");
    client.query(
      "SELECT i.* FROM Item i INNER JOIN Cardapio_Item ci ON i.ID = ci.Item_ID WHERE ci.Cardapio_ID = $1",
      [req.params.id],
      (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de SELECT itens por cardápio id", err);
        }
        res.send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// CREATE (POST) - Criar item em um cardápio
app.post("/cardapio/:id/adicionar-item", (req, res) => {
  const { id } = req.params; // Cardapio ID
  const { itemId } = req.body; // Item ID

  try {
    client.query(
      "INSERT INTO Cardapio_Item (Cardapio_ID, Item_ID) VALUES ($1, $2)",
      [id, itemId],
      (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de INSERT na tabela Cardapio_Item", err);
        }
        res.status(201).json({ message: "Item adicionado ao cardápio com sucesso!" });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// DELETE (DELETE) - Remover item de um cardápio
app.delete("/cardapio/:id/remover-item/:itemId", (req, res) => {
  const { id, itemId } = req.params; // Cardapio ID and Item ID

  try {
    client.query(
      "DELETE FROM Cardapio_Item WHERE Cardapio_ID = $1 AND Item_ID = $2",
      [id, itemId],
      (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de DELETE na tabela Cardapio_Item", err);
        }
        if (result.rowCount > 0) {
          res.status(200).json({ message: "Item removido do cardápio com sucesso!" });
        } else {
          res.status(404).json({ message: "Item ou cardápio não encontrado." });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// DELETE (DELETE) - Excluir todos os itens de um cardápio 
app.delete("/cardapio/:id/itens", (req, res) => {
  const cardapioId = req.params.id;

  client.query(
      "DELETE FROM Cardapio_Item WHERE Cardapio_ID = $1",
      [cardapioId],
      (err, result) => {
          if (err) {
              return res.status(500).json({ error: "Erro ao excluir itens" });
          }
          res.status(200).json({ message: "Itens removidos com sucesso" });
      }
  );
});

// Rota para verificar se um cardápio já foi avaliado
app.get('/cardapio/:id/avaliado', (req, res) => {
  const cardapioId = req.params.id;

  const query = 'SELECT COUNT(*) AS total FROM Avaliacao WHERE cardapio_id = $1';
  
  client.query(query, [cardapioId], (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Erro ao verificar avaliações.' });
      }

      // Retorna true se o total for maior que 0, caso contrário, false
      const foiAvaliado = result.rows[0].total > 0;
      res.json({ foiAvaliado });
  });
});


/************************************************* Rotas da Tabela Item *************************************************/
// UPDATE (PUT) - Atualizar item
app.put("/itens/:id", (req, res) => {
  try {
    console.log("Alguém enviou um update com os dados do item:", req.body);
    const id = req.params.id;
    const { nome, descricao, imagem_url } = req.body;
    client.query(
      "UPDATE Item SET nome=$1, descricao=$2, imagem_url=$3 WHERE id=$4",
      [nome, descricao, imagem_url, id],
      (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de UPDATE item", err);
        } else {
          res.status(202).json({ "identificador": id });
          console.log(result);
        }
      }
    );
  } catch (erro) {
    console.error(erro);
  }
});

// DELETE (DELETE) - Excluir item
app.delete("/itens/:id", (req, res) => {
  try {
    console.log("Rota: delete item/" + req.params.id);

    // Validação de presença em cardápios
    client.query(
      "SELECT * FROM Cardapio_Item WHERE Item_ID = $1", [req.params.id], (err, result) => {
        if (err) {
          // Retornar mensagem de erro com status code
          console.error("Erro ao executar a qry de SELECT item", err);
          return res.status(500).json({ error: "Erro no servidor ao verificar item em cardápio" });
        }

        // Se o item está em algum cardápio, impedir exclusão
        if (result.rowCount > 0) {
          return res.status(400).json({ info: "Item em cardápio. Não pode ser excluído." });
        }

        // Se não está em nenhum cardápio, pode excluir
        client.query(
          "DELETE FROM Item WHERE id = $1", [req.params.id],
          (err, result) => {
            if (err) {
              console.error("Erro ao executar a qry de DELETE item", err);
              return res.status(500).json({ error: "Erro no servidor ao excluir item" });
            }

            if (result.rowCount == 0) {
              return res.status(404).json({ info: "Item não encontrado." });
            }

            res.status(200).json({ info: "Item excluído com sucesso." });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// READ (GET) - Listar todos os itens
app.get("/itens", (req, res) => {
  try {
    console.log("Rota: get itens");
    client.query("SELECT * FROM Item", (err, result) => {
      if (err) {
        return console.error("Erro ao executar a qry de SELECT", err);
      }
      res.send(result.rows);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// CREATE (POST) - Criar um item
app.post("/itens", (req, res) => {
  try {
    console.log("Alguém enviou um post com os dados:", req.body);
    const { nome, descricao, imagem_url } = req.body;

    // Validação dos dados
    if (!nome || !descricao) {
      return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
    }

    client.query(
      "INSERT INTO Item (nome, descricao, imagem_url) VALUES ($1, $2, $3) RETURNING *",
      [nome, descricao, imagem_url],
      (err, result) => {
        if (err) {
          console.error("Erro ao executar a qry de INSERT", err);
          return res.status(500).json({ error: "Erro ao criar item." });
        }

        const { id } = result.rows[0];
        res.setHeader("id", id); // Configurando o header com o ID do novo item
        res.status(201).json(result.rows[0]); // Retornando o item criado
        console.log(result);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao processar a requisição." });
  }
});

/************************************************ Rotas para a tabela Usuarios *****************************************************/ 
// READ (GET) - Listar todos os usuários
app.get('/usuarios', (req, res) => {
    client.query('SELECT * FROM Usuarios', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários.' });
        }
        res.json(result.rows);
    });
});

// READ (GET) - Buscar um usuário pelo ID
app.get('/usuarios/:id', (req, res) => {
    client.query('SELECT * FROM Usuarios WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário.' });
        }
        res.json(result.rows[0]);
    });
});

// CREATE (POST) - Criar um usuário
app.post('/usuarios', (req, res) => {
    const { nome, email, foto, perfil } = req.body;
    client.query(
        'INSERT INTO Usuarios (nome, email, foto, perfil) VALUES ($1, $2, $3, $4) RETURNING *',
        [nome, email, foto, perfil],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar usuário.' });
            }
            res.status(201).json(result.rows[0]);
        }
    );
});

// UPDATE (PUT) - Atualizar um usuário
app.put('/usuarios/:id', (req, res) => {
    const { nome, email, foto, perfil } = req.body;
    client.query(
        'UPDATE Usuarios SET nome = $1, email = $2, foto = $3, perfil = $4 WHERE id = $5 RETURNING *',
        [nome, email, foto, perfil, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
            }
            res.json(result.rows[0]);
        }
    );
});

// DELETE (DELETE) - Deletar um usuário
app.delete('/usuarios/:id', (req, res) => {
    const usuarioId = req.params.id;

    // Verificar se o usuário já fez uma avaliação
    client.query('SELECT COUNT(*) FROM avaliacao WHERE usuarios_id = $1', [usuarioId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar avaliações do usuário.' });
        }

        const avaliacaoCount = parseInt(result.rows[0].count, 10);

        if (avaliacaoCount > 0) {
            // Impedir exclusão caso o usuário tenha avaliações
            return res.status(400).json({ error: 'Não é possível excluir um usuário que já fez avaliações.' });
        }

        // Se o usuário não fez nenhuma avaliação, proceder com a exclusão
        client.query('DELETE FROM Usuarios WHERE id = $1 RETURNING *', [usuarioId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao deletar usuário.' });
            }
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.json({ message: 'Usuário excluído.' });
        });
    });
});

/**************************************************** Rotas para a tabela Avaliacao **********************************************/
// READ (GET) - Listar todas as avaliações
app.get('/avaliacoes', (req, res) => {
    client.query('SELECT * FROM Avaliacao', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avaliações.' });
        }
        res.json(result.rows);
    });
});

// READ (GET) - Listar uma avaliação por ID 
app.get('/avaliacoes/:id', (req, res) => {
    client.query('SELECT * FROM Avaliacao WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avaliação.' });
        }
        res.json(result.rows[0]);
    });
});

// CREATE (POST) - Criar uma nova avaliação
app.post('/avaliacoes', (req, res) => {
  const { pontuacao, comentario, usuarios_id, cardapio_id } = req.body;

  // Verifique se os campos obrigatórios estão presentes
  if (!pontuacao || !usuarios_id || !cardapio_id) {
      return res.status(400).json({ error: 'Pontuação, Usuários_ID e Cardapio_ID são obrigatórios.' });
  }

  // Verifique se já existe uma avaliação para o mesmo usuário e cardápio
  client.query(
      'SELECT * FROM Avaliacao WHERE Usuarios_ID = $1 AND Cardapio_ID = $2',
      [usuarios_id, cardapio_id],
      (err, result) => {
          if (err) {
              return res.status(400).json({ error: 'Erro ao verificar avaliação existente.' });
          }

          // Se já existe uma avaliação, retorne um erro
          if (result.rowCount > 0) {
              return res.status(400).json({ error: 'Usuário já avaliou este cardápio.' });
          }

          // Se não existe avaliação, prossiga com a inserção
          client.query(
              'INSERT INTO Avaliacao (pontuacao, comentario, data, Usuarios_ID, Cardapio_ID) VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING *',
              [pontuacao, comentario, usuarios_id, cardapio_id],
              (err, result) => {
                  if (err) {
                      return res.status(500).json({ error: 'Erro ao criar avaliação.' });
                  }
                  res.status(201).json(result.rows[0]);
              }
          );
      }
  );
});

// UPDATE (PUT) - Atualizar uma avaliação por ID
app.put('/avaliacoes/:id', (req, res) => {
  const { pontuacao, comentario, usuarios_id, cardapio_id } = req.body;

  // Verifique se o ID da avaliação foi fornecido
  if (!req.params.id) {
      return res.status(400).json({ error: 'ID da avaliação é obrigatório.' });
  }

  client.query(
      'UPDATE Avaliacao SET pontuacao = $1, comentario = $2, data = CURRENT_DATE, Usuarios_ID = $3, Cardapio_ID = $4 WHERE id = $5 RETURNING *',
      [pontuacao, comentario, usuarios_id, cardapio_id, req.params.id],
      (err, result) => {
          if (err) {
              return res.status(500).json({ error: 'Erro ao atualizar avaliação.' });
          }
          if (result.rowCount === 0) {
              return res.status(404).json({ error: 'Avaliação não encontrada.' });
          }
          res.json(result.rows[0]);
      }
  );
});

// DELETE (DELETE) - Deletar uma avaliacao
app.delete('/avaliacoes/:id', (req, res) => {
    client.query('DELETE FROM Avaliacao WHERE id = $1 RETURNING *', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar avaliação.' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Avaliação não encontrada.' });
        }
        res.json({ message: 'Avaliação excluída.' });
    });
});

// READ (GET) - Listar avaliações pelo ID do cardápio
app.get('/cardapio/:id/avaliacoes', (req, res) => {
  const cardapioId = req.params.id; // Obtém o ID do cardápio da URL

  client.query('SELECT * FROM Avaliacao WHERE Cardapio_ID = $1', [cardapioId], (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Erro ao buscar avaliações.' });
      }

      // Verifica se existem avaliações
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Nenhuma avaliação encontrada para este cardápio.' });
      }

      res.json(result.rows); // Retorna todas as avaliações encontradas
  });
});

/*********************************************** Rotas para a tabela Avisos *******************************************************/
// READ (GET) - Listar todos os avisos
app.get('/avisos', (req, res) => {
    client.query('SELECT * FROM Avisos', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avisos.' });
        }
        res.json(result.rows);
    });
});

// READ (GET) - Listar todos os avisos por ID
app.get('/avisos/:id', (req, res) => {
    client.query('SELECT * FROM Avisos WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar aviso.' });
        }
        res.json(result.rows[0]);
    });
});

// CREATE (POST) - Criar novo aviso
app.post('/avisos', (req, res) => {
    const { data, aviso, tipo, Usuarios_ID } = req.body;
    client.query(
        'INSERT INTO Avisos (data, aviso, tipo, Usuarios_ID) VALUES ($1, $2, $3, $4) RETURNING *',
        [data, aviso, tipo, Usuarios_ID],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar aviso.' });
            }
            res.status(201).json(result.rows[0]);
        }
    );
});

// UPDATE (PUT) - Atualizar aviso
app.put('/avisos/:id', (req, res) => {
    const { data, aviso, tipo, Usuarios_ID } = req.body;
    client.query(
        'UPDATE Avisos SET data = $1, aviso = $2, tipo = $3, Usuarios_ID = $4 WHERE id = $5 RETURNING *',
        [data, aviso, tipo, Usuarios_ID, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar aviso.' });
            }
            res.json(result.rows[0]);
        }
    );
});

// DELETE (DELETE) - Excluir aviso
app.delete('/avisos/:id', (req, res) => {
    client.query('DELETE FROM Avisos WHERE id = $1 RETURNING *', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar aviso.' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Aviso não encontrado.' });
        }
        res.json({ message: 'Aviso excluído.' });
    });
});

/*********************************************** Rotas para a tabela Cardapio_Item ********************************************************/
// CREATE (POST) - Adicionar novo Cardapio_Item
app.post('/cardapio_item', (req, res) => {
  const { Cardapio_ID, Item_ID } = req.body;
  client.query(
      'INSERT INTO Cardapio_Item (Cardapio_ID, Item_ID) VALUES ($1, $2) RETURNING *',
      [Cardapio_ID, Item_ID],
      (err, result) => {
          if (err) {
              return res.status(500).json({ error: 'Erro ao adicionar item ao cardápio.' });
          }
          res.status(201).json(result.rows[0]);
      }
  );
});

// READ (GET) - Listar todos os itens de cardápio
app.get('/cardapio_item', (req, res) => {
  client.query('SELECT * FROM Cardapio_Item', (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Erro ao listar itens do cardápio.' });
      }
      res.json(result.rows);
  });
});

// READ (GET) - Obter item de cardápio por ID
app.get('/cardapio_item/:id', (req, res) => {
  const { id } = req.params;
  client.query('SELECT * FROM Cardapio_Item WHERE ID = $1', [id], (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Erro ao obter item do cardápio.' });
      }
      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Item do cardápio não encontrado.' });
      }
      res.json(result.rows[0]);
  });
});

// UPDATE (PUT) - Atualizar item de cardápio
app.put('/cardapio_item/:id', (req, res) => {
  const { id } = req.params;
  const { Cardapio_ID, Item_ID } = req.body;
  client.query(
      'UPDATE Cardapio_Item SET Cardapio_ID = $1, Item_ID = $2 WHERE ID = $3 RETURNING *',
      [Cardapio_ID, Item_ID, id],
      (err, result) => {
          if (err) {
              return res.status(500).json({ error: 'Erro ao atualizar item do cardápio.' });
          }
          if (result.rowCount === 0) {
              return res.status(404).json({ error: 'Item do cardápio não encontrado.' });
          }
          res.json(result.rows[0]);
      }
  );
});

// DELETE (DELETE) - Excluir item de cardápio
app.delete('/cardapio_item/:id', (req, res) => {
  const { id } = req.params;
  client.query('DELETE FROM Cardapio_Item WHERE ID = $1 RETURNING *', [id], (err, result) => {
      if (err) {
          return res.status(500).json({ error: 'Erro ao excluir item do cardápio.' });
      }
      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Item do cardápio não encontrado.' });
      }
      res.json({ message: 'Item do cardápio excluído com sucesso.' });
  });
});

module.exports = app;
