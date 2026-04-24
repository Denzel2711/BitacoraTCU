// Declaración para que TS reconozca archivos CSS globales
declare module "*.css";

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}