const app = require("./app");
require("dotenv").config();

app.listen(process.env.PORT, () => {
    console.log(`Server corriendo en el puerto ${process.env.PORT}`);
});

app.get("/", (req, res) => {
    res.json({ message: "Bienvenido a la API de MySQL" });
});