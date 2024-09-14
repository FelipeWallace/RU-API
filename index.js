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

// READ (GET) CARDAPIO
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

// READ (GET) CARDAPIO BY ID
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

// DELETE CARDAPIO BY ID
app.delete("/cardapio/:id", (req, res) => {
  try {
    console.log("Rota: delete/" + req.params.id);
    client.query(
      "DELETE FROM cardapio WHERE id = $1", [req.params.id], (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de DELETE", err);
        } else {
          if (result.rowCount == 0) {
            res.status(404).json({ info: "Registro não encontrado." });
          } else {
            res.status(200).json({ info: "Registro excluído." });
          }
        }
        console.log(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// CREATE (POST) CARDAPIO
app.post("/cardapio", (req, res) => {
  try {
    console.log("Alguém enviou um post com os dados:", req.body);
    const { data, refeicao, titulo } = req.body;
    client.query(
      "INSERT INTO cardapio (data, refeicao, titulo) VALUES ($1, $2, $3) RETURNING * ", [data, refeicao, titulo],
      (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de INSERT", err);
        }
        const { id } = result.rows[0];
        res.setHeader("id", $`{id}`);
        res.status(201).json(result.rows[0]);
        console.log(result);
      }
    );
  } catch (erro) {
    console.error(erro);
  }
});

// UPDATE (PUT) CARDAPIO
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

// READ (GET) ITENS BY CARDAPIO ID
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

// // CREATE (POST) ITEM
// app.post("/cardapio/:id/itens", (req, res) => {
//     try {
//       console.log("Alguém enviou um post com os dados de um item:", req.body);
//       const { nome, descricao, imagem_url } = req.body;
//       const cardapioId = req.params.id;

//       client.query(
//         "INSERT INTO Item (nome, descricao, imagem_url) VALUES ($1, $2, $3) RETURNING *",
//         [nome, descricao, imagem_url],
//         (err, result) => {
//           if (err) {
//             return console.error("Erro ao executar a qry de INSERT item", err);
//           }

//           const itemId = result.rows[0].id;

//           client.query(
//             "INSERT INTO CardapioItem (Cardapio_ID, Item_ID) VALUES ($1, $2) RETURNING *",
//             [cardapioId, itemId],
//             (err, result) => {
//               if (err) {
//                 return console.error("Erro ao executar a qry de associação do item ao cardápio", err);
//               }
//               res.status(201).json(result.rows[0]);
//             }
//           );
//         }
//       );
//     } catch (erro) {
//       console.error(erro);
//     }
//   });

// UPDATE (PUT) ITEM
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

// DELETE ITEM BY ID
// app.delete("/itens/:id", (req, res) => {
//   let podeExcluir = false;
//   try {
//     console.log("Rota: delete item/" + req.params.id);
//     //validacao de presenca em cardapios
//     client.query(
//       "SELECT * FROM Cardapio_Item WHERE Item_ID = $1", [req.params.id], (err, result) => {
//         if (err) {
//           // retornar mensagem de erro com status code
//           return console.error("Erro ao executar a qry de SELECT item", err);
//         }
//         if (result.rowCount > 0) {
//           res.status(400).json({ info: "Item em cardápio. Não pode ser excluído." });
//         } else {
//           podeExcluir = true;
//         }
//       }
//     )
//     if (podeExcluir) {
//       client.query(
//         "DELETE FROM Item WHERE id = $1",
//         [req.params.id],
//         (err, result) => {
//           if (err) {
//             return console.error("Erro ao executar a qry de DELETE item", err);
//           } else {
//             if (result.rowCount == 0) {
//               res.status(404).json({ info: "Item não encontrado." });
//             } else {
//               res.status(200).json({ info: `Item excluído.` });
//             }
//           }
//           console.log(result);
//         }
//       );
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

// DELETE ITEM BY ID
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


// READ (GET) ITENS
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

// ADD ITEM TO CARDAPIO
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

// DELETE ITEM FROM CARDAPIO
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

// CREATE (POST) ITEM
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

// Rotas para a tabela Usuarios
app.get('/usuarios', (req, res) => {
    client.query('SELECT * FROM Usuarios', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários.' });
        }
        res.json(result.rows);
    });
});

app.get('/usuarios/:id', (req, res) => {
    client.query('SELECT * FROM Usuarios WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário.' });
        }
        res.json(result.rows[0]);
    });
});

app.post('/usuarios', (req, res) => {
    const { nome, email, senha, perfil } = req.body;
    client.query(
        'INSERT INTO Usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING *',
        [nome, email, senha, perfil],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar usuário.' });
            }
            res.status(201).json(result.rows[0]);
        }
    );
});

app.put('/usuarios/:id', (req, res) => {
    const { nome, email, senha, perfil } = req.body;
    client.query(
        'UPDATE Usuarios SET nome = $1, email = $2, senha = $3, perfil = $4 WHERE id = $5 RETURNING *',
        [nome, email, senha, perfil, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
            }
            res.json(result.rows[0]);
        }
    );
});

app.delete('/usuarios/:id', (req, res) => {
    client.query('DELETE FROM Usuarios WHERE id = $1 RETURNING *', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar usuário.' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json({ message: 'Usuário excluído.' });
    });
});

// Rotas para a tabela Avaliacao
app.get('/avaliacoes', (req, res) => {
    client.query('SELECT * FROM Avaliacao', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avaliações.' });
        }
        res.json(result.rows);
    });
});

app.get('/avaliacoes/:id', (req, res) => {
    client.query('SELECT * FROM Avaliacao WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avaliação.' });
        }
        res.json(result.rows[0]);
    });
});

app.post('/avaliacoes', (req, res) => {
  const { pontuacao, comentario, Usuarios_ID, Cardapio_ID } = req.body;

  // Verifique se os campos obrigatórios estão presentes
  if (!pontuacao || !Usuarios_ID || !Cardapio_ID) {
      return res.status(400).json({ error: 'Pontuação, Usuários_ID e Cardapio_ID são obrigatórios.' });
  }

  // Verifique se já existe uma avaliação para o mesmo usuário e cardápio
  client.query(
      'SELECT * FROM Avaliacao WHERE Usuarios_ID = $1 AND Cardapio_ID = $2',
      [Usuarios_ID, Cardapio_ID],
      (err, result) => {
          if (err) {
              return res.status(500).json({ error: 'Erro ao verificar avaliação existente.' });
          }

          // Se já existe uma avaliação, retorne um erro
          if (result.rowCount > 0) {
              return res.status(400).json({ error: 'Usuário já avaliou este cardápio.' });
          }

          // Se não existe avaliação, prossiga com a inserção
          client.query(
              'INSERT INTO Avaliacao (pontuacao, comentario, data, Usuarios_ID, Cardapio_ID) VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING *',
              [pontuacao, comentario, Usuarios_ID, Cardapio_ID],
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



app.put('/avaliacoes/:id', (req, res) => {
  const { pontuacao, comentario, Usuarios_ID, Cardapio_ID } = req.body;

  // Verifique se o ID da avaliação foi fornecido
  if (!req.params.id) {
      return res.status(400).json({ error: 'ID da avaliação é obrigatório.' });
  }

  client.query(
      'UPDATE Avaliacao SET pontuacao = $1, comentario = $2, data = CURRENT_DATE, Usuarios_ID = $3, Cardapio_ID = $4 WHERE id = $5 RETURNING *',
      [pontuacao, comentario, Usuarios_ID, Cardapio_ID, req.params.id],
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

// Rotas para a tabela Avisos
app.get('/avisos', (req, res) => {
    client.query('SELECT * FROM Avisos', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar avisos.' });
        }
        res.json(result.rows);
    });
});

app.get('/avisos/:id', (req, res) => {
    client.query('SELECT * FROM Avisos WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar aviso.' });
        }
        res.json(result.rows[0]);
    });
});

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
