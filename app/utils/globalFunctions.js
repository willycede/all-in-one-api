
const currency = require('currency.js');
const formatToDolar=(value, currencyType='$', precision=2, separator=',')=>{
   return currency(value, {separator, precision}).format(currencyType)
}
const formatToCurrency = (value, precision=2, separator=',')=>{
   return currency(value, {separator, precision})
}

const validarEmail = (mail) => {
   const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+([^<>()\.,;:\s@\"]{2,}|[\d\.]+))$/;
    return emailRegex.test(mail);
}

const validarRuc= (number) =>{
    var dto = number.length;
    var valor;
    var acu=0;
 
     for (var i=0; i<dto; i++){
        valor = number.substring(i,i+1);
        if(valor==0||valor==1||valor==2||valor==3||valor==4||valor==5||valor==6||valor==7||valor==8||valor==9){
            acu = acu+1;
        }
     }
     if(acu==dto){
      while(number.substring(10,13)!=001){
       return {status:0, message:"The last three digits not have the ruc code 001"}
      }
      while(number.substring(0,2)>24){    
       return {status:0, message:"The two first digits can not be greater than 24"}
      }
        // var porcion1 = number.substring(2,3);
        // if(porcion1<6){
        // alert('El tercer dígito es menor a 6, por lo \ntanto el usuario es una persona natural.\n');
        // }
        // else{
        // if(porcion1==6){
        //     alert('El tercer dígito es igual a 6, por lo \ntanto el usuario es una entidad pública.\n');
        // }
        // else{
        //     if(porcion1==9){
        //     alert('El tercer dígito es igual a 9, por lo \ntanto el usuario es una sociedad privada.\n');
        //     }
        // }
        // }
        return {status:1, message:""}
     }
}

const validarRucCedula= (numero) =>{
    var suma = 0;      
    var residuo = 0;      
    var pri = false;      
    var pub = false;            
    var nat = false;      
    var numeroProvincias = 22;                  
    var modulo = 11;
                
    /* Verifico que el campo no contenga letras */                  
    var ok=1;
    for (i=0; i<numero.length && ok==1 ; i++){
       var n = parseInt(numero.charAt(i));
       if (isNaN(n)) ok=0;
    }
    if (ok==0){    
       return {status:0, message:"No puede ingresar caracteres en el número"}    
    }
                
    if (numero.length < 10 ){               
       return {status:0, message:"El número ingresado no es válido"} 
    }
   
    /* Los primeros dos digitos corresponden al codigo de la provincia */
    provincia = numero.substr(0,2);      
    if (provincia < 1 || provincia > numeroProvincias){           
        return {status:0, message:"El código de la provincia (dos primeros dígitos) es inválido"}     
    }

    /* Aqui almacenamos los digitos de la cedula en variables. */
    d1  = numero.substr(0,1);         
    d2  = numero.substr(1,1);         
    d3  = numero.substr(2,1);         
    d4  = numero.substr(3,1);         
    d5  = numero.substr(4,1);         
    d6  = numero.substr(5,1);         
    d7  = numero.substr(6,1);         
    d8  = numero.substr(7,1);         
    d9  = numero.substr(8,1);         
    d10 = numero.substr(9,1);                
       
    /* El tercer digito es: */                           
    /* 9 para sociedades privadas y extranjeros   */         
    /* 6 para sociedades publicas */         
    /* menor que 6 (0,1,2,3,4,5) para personas naturales */ 

    if (d3==7 || d3==8){           
       return {status:0, message:"El tercer dígito ingresado es inválido"}                       
    }         
       
    /* Solo para personas naturales (modulo 10) */         
    if (d3 < 6){           
       nat = true;            
       p1 = d1 * 2;  if (p1 >= 10) p1 -= 9;
       p2 = d2 * 1;  if (p2 >= 10) p2 -= 9;
       p3 = d3 * 2;  if (p3 >= 10) p3 -= 9;
       p4 = d4 * 1;  if (p4 >= 10) p4 -= 9;
       p5 = d5 * 2;  if (p5 >= 10) p5 -= 9;
       p6 = d6 * 1;  if (p6 >= 10) p6 -= 9; 
       p7 = d7 * 2;  if (p7 >= 10) p7 -= 9;
       p8 = d8 * 1;  if (p8 >= 10) p8 -= 9;
       p9 = d9 * 2;  if (p9 >= 10) p9 -= 9;             
       modulo = 10;
    }         

    /* Solo para sociedades publicas (modulo 11) */                  
    /* Aqui el digito verficador esta en la posicion 9, en las otras 2 en la pos. 10 */
    else if(d3 == 6){           
       pub = true;             
       p1 = d1 * 3;
       p2 = d2 * 2;
       p3 = d3 * 7;
       p4 = d4 * 6;
       p5 = d5 * 5;
       p6 = d6 * 4;
       p7 = d7 * 3;
       p8 = d8 * 2;            
       p9 = 0;            
    }         
       
    /* Solo para entidades privadas (modulo 11) */         
    else if(d3 == 9) {           
       pri = true;                                   
       p1 = d1 * 4;
       p2 = d2 * 3;
       p3 = d3 * 2;
       p4 = d4 * 7;
       p5 = d5 * 6;
       p6 = d6 * 5;
       p7 = d7 * 4;
       p8 = d8 * 3;
       p9 = d9 * 2;            
    }
              
    suma = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;                
    residuo = suma % modulo;                                         

    /* Si residuo=0, dig.ver.=0, caso contrario 10 - residuo*/
    digitoVerificador = residuo==0 ? 0: modulo - residuo;                

    /* ahora comparamos el elemento de la posicion 10 con el dig. ver.*/                         
    if (pub==true){           
       if (digitoVerificador != d9){     
          return {status:0, message:"El ruc de la empresa del sector público es incorrecto."}                      
       }                  
       /* El ruc de las empresas del sector publico terminan con 0001*/         
       if ( numero.substr(9,4) != '0001' ){     
          return {status:0, message:"El ruc de la empresa del sector público debe terminar con 0001"}                 
       }
    }         
    else if(pri == true){         
       if (digitoVerificador != d10){    
          return {status:0, message:"El ruc de la empresa del sector privado es incorrecto."}
       }         
       if ( numero.substr(10,3) != '001' ){                    
          return {status:0, message:"El ruc de la empresa del sector privado debe terminar con 001"}
       }
    }      

    else if(nat == true){         
       if (digitoVerificador != d10){    
          return {status:0, message:"El número de cédula de la persona natural es incorrecto."}
       }         
       if (numero.length >10 && numero.substr(10,3) != '001' ){ 
          return {status:0, message:"El ruc de la persona natural debe terminar con 001"}                    
       }
    }      
    return {status:1, message:""};
}
   
const nameExistanceValidation=(name, model)=>{
    existsInModel=async() =>await knex(model)
    .where({
        name,
        status: constants.STATUS_ACTIVE,
        deleted_at: null
    })
        .count()
    if (existsInModel > 0) {
        return true
    } else {
        return false
    }
}

const generateTableHeader=(columns)=>{
    let tr=''
    columns.forEach(element => {
        tr= tr + `<th colspan=${element.colspan}>${element.name}</th>\n`
    });
    return tr
}

const generateTableContent=(columns, dataRows)=>{
    let trs=''
    dataRows.forEach(row => {
        trs  = trs+'<tr>\n'
        columns.forEach(column => {
            trs=trs+ `<td>${row[column.identifier]}</td>\n`
        });
        trs = trs + '</tr>\n'
    });
   
    return trs
}
   module.exports={
       validarRuc,
       generateTableHeader,
       generateTableContent,
       validarRucCedula,
       formatToDolar,
       formatToCurrency,
       validarEmail
   }

   
