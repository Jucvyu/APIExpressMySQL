const app = require("./app");
require("dotenv").config();

app.listen(process.env.PORT, () => {
    console.log(`Server corriendo en el puerto ${process.env.PORT}`);
});