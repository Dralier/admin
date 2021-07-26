// $(document).ready(function(){
//     $("#buscador").on("keyup", function() {
//       var value = $(this).val().toLowerCase();
//       $("#myTable tr").filter(function() {
//         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
//       });
//     });
//   });

window.onload = ()=> {

    const buttonAdd = document.querySelector("#addBtn");
    buttonAdd.addEventListener("click", ()=> {
        window.location = "/agregar_libro";
    })

    const rows = document.querySelectorAll(".libro-row");
    for (const r of rows) {
        r.addEventListener("click", (e)=> {
            window.location = "/libros/" + e.target.isbn;
        })
    }   
    



}