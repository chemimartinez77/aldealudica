import os

def export_directory_structure(root_dir):
    output = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Excluir las carpetas .next y node_modules
        dirnames[:] = [d for d in dirnames if d not in ['.next', 'node_modules', '.git']]
        
        # Añadir el directorio actual
        output.append(f"Directorio: {dirpath}")
        
        # Procesar cada archivo en el directorio
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            file_size = os.path.getsize(file_path)  # Tamaño en bytes
            if file_size == 0:
                size_info = "0 Bytes (vacío)"
            else:
                size_info = f"{file_size} Bytes"
            output.append(f"  - Archivo: {filename}, Tamaño: {size_info}")
    
    # Unir todo en un solo texto
    return "\n".join(output)

# Ejemplo de uso
root_directory = "C:\\_Chemi\\aldealudica"
structure = export_directory_structure(root_directory)
print(structure)

# Opcional: Guardar en un fichero
with open("estructura_directorios.txt", "w", encoding="utf-8") as f:
    f.write(structure)



