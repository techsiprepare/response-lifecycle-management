#!/usr/bin/env python3
"""
Apps Script Bundler
-------------------
Este script consolida múltiplos arquivos .js/.gs e .html em dois arquivos finais:
1. `bundled_backend.gs` - Contém todas as funções e módulos do back-end.
2. `bundled_frontend.html` - Contém a interface e os componentes do front-end.

Uso:
    python bundler.py [--dir CAMINHO_DO_PROJETO]
"""

import os
import re
import argparse
from pathlib import Path

# Arquivos/Diretórios a serem ignorados na busca
IGNORE_DIRS = {'.git', 'node_modules', '.clasp', '__pycache__', 'dist', 'build'}
IGNORE_FILES = {'bundle.py', 'bundled_backend.gs', 'bundled_frontend.html'}

def get_backend_sort_key(filepath: Path, source_dir: Path):
    """
    Retorna uma chave de ordenação para garantir a ordem de inicialização no Google Apps Script:
    1. models/
    2. repositories/Base.js seguido dos demais repositories/
    3. services/
    4. controllers/
    5. tests/
    """
    rel_path = filepath.relative_to(source_dir).as_posix()
    
    if rel_path.startswith("backend/models/"):
        return (1, rel_path)
    elif rel_path == "backend/repositories/Base.js":
        return (2, "000_Base.js")
    elif rel_path.startswith("backend/repositories/"):
        return (2, rel_path)
    elif rel_path.startswith("backend/services/"):
        return (3, rel_path)
    elif rel_path.startswith("backend/controllers/"):
        return (4, rel_path)
    elif rel_path.startswith("backend/tests/"):
        return (5, rel_path)
    else:
        return (6, rel_path)

def find_files(source_dir: Path):
    """Encontra todos os arquivos .js, .gs e .html no diretório."""
    backend_files = []
    frontend_files = []

    for root, dirs, files in os.walk(source_dir):
        # Ignora diretórios indesejados
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in sorted(files):
            if file in IGNORE_FILES:
                continue
            
            filepath = Path(root) / file
            if file.endswith(('.js', '.gs')):
                backend_files.append(filepath)
            elif file.endswith('.html'):
                frontend_files.append(filepath)

    backend_files.sort(key=lambda p: get_backend_sort_key(p, source_dir))
    return backend_files, frontend_files

def bundle_backend(backend_files: list[Path], output_path: Path):
    """Junta todos os arquivos .js e .gs em um único arquivo .gs."""
    print(f"📦 Unificando {len(backend_files)} arquivos do Back-end...")
    
    with open(output_path, 'w', encoding='utf-8') as outfile:
        outfile.write("// ==========================================================\n")
        outfile.write("// BUNDLE AUTOMÁTICO DO BACK-END (Google Apps Script)\n")
        outfile.write("// ==========================================================\n\n")

        for filepath in backend_files:
            rel_path = filepath.name
            outfile.write(f"\n// {'='*70}\n")
            outfile.write(f"// INÍCIO DO ARQUIVO: {rel_path}\n")
            outfile.write(f"// {'='*70}\n\n")

            content = filepath.read_text(encoding='utf-8')
            outfile.write(content)
            outfile.write("\n\n")

    print(f"✅ Back-end gerado em: {output_path.resolve()}")

def bundle_frontend(frontend_files: list[Path], output_path: Path, source_dir: Path):
    """
    Junta os arquivos .html. Se houver chamadas do tipo <?!= include('NOME') ?> 
    ou <?!= HtmlService.create... ?>, realiza a substituição in-line; 
    caso contrário, concatena os componentes de forma segura.
    """
    print(f"📦 Unificando {len(frontend_files)} arquivos do Front-end...")

    # Mapeia os arquivos por nome curto e por caminho relativo
    file_map = {}
    main_file = None

    for filepath in frontend_files:
        name_without_ext = filepath.stem
        file_map[filepath.name] = filepath
        file_map[name_without_ext] = filepath

        try:
            rel_path = filepath.relative_to(source_dir).as_posix()
            file_map[rel_path] = filepath
            if rel_path.endswith('.html'):
                file_map[rel_path[:-5]] = filepath
            
            if rel_path.startswith('frontend/'):
                rel_frontend = rel_path[len('frontend/'):]
                file_map[rel_frontend] = filepath
                if rel_frontend.endswith('.html'):
                    file_map[rel_frontend[:-5]] = filepath
        except ValueError:
            pass
        
        # Identifica se há um arquivo principal de entrada (ex: FE-Index ou Index)
        if 'index' in filepath.name.lower():
            main_file = filepath

    embedded_files = set()

    def resolve_includes(content: str, current_file: Path) -> str:
        """Substitui tags de inclusão do GAS pelo conteúdo real do arquivo."""
        # Padrões comuns de include do GAS:
        # <?!= HtmlService.createHtmlOutputFromFile('NOME').getContent(); ?>
        # <?!= include('NOME'); ?>
        pattern = re.compile(
            r"<\?!=\s*(?:include|HtmlService\.create(?:HtmlOutput|Template)FromFile)\s*\(\s*['\"]([^'\"]+)['\"]\s*\)(?:\.evaluate\(\))?(?:\.getContent\(\))?\s*;?\s*\?>",
            re.IGNORECASE
        )

        def replace_match(match):
            target_name = match.group(1).replace('\\', '/')
            target_path = file_map.get(target_name) or file_map.get(f"{target_name}.html")
            
            if target_path and target_path != current_file:
                embedded_files.add(target_path)
                child_content = target_path.read_text(encoding='utf-8')
                # Recursão para includes aninhados
                return resolve_includes(child_content, target_path)
            return match.group(0)

        return re.sub(pattern, replace_match, content)

    with open(output_path, 'w', encoding='utf-8') as outfile:
        outfile.write("<!-- ========================================================== -->\n")
        outfile.write("<!-- BUNDLE AUTOMÁTICO DO FRONT-END (HTML / UI)                 -->\n")
        outfile.write("<!-- ========================================================== -->\n\n")

        # Se houver um arquivo principal (Index), processa seus includes
        if main_file:
            print(f"   -> Arquivo principal detectado: {main_file.name}")
            main_content = main_file.read_text(encoding='utf-8')
            processed_content = resolve_includes(main_content, main_file)
            outfile.write(processed_content)
            outfile.write("\n\n")
            embedded_files.add(main_file)

        # Adiciona quaisquer outros componentes HTML que não foram inclusos via include tag
        remaining_files = [f for f in frontend_files if f not in embedded_files]
        if remaining_files:
            outfile.write("\n<!-- ========================================================== -->\n")
            outfile.write("<!-- COMPONENTES E MÓDULOS ADICIONAIS                           -->\n")
            outfile.write("<!-- ========================================================== -->\n\n")
            
            for filepath in remaining_files:
                outfile.write(f"\n<!-- --- INÍCIO: {filepath.name} --- -->\n")
                outfile.write(filepath.read_text(encoding='utf-8'))
                outfile.write(f"\n<!-- --- FIM: {filepath.name} --- -->\n\n")

    print(f"✅ Front-end gerado em: {output_path.resolve()}")

def main():
    parser = argparse.ArgumentParser(description="Empacota arquivos de um projeto Google Apps Script em 2 arquivos únicos.")
    parser.add_argument("--dir", default=".", help="Caminho do diretório raiz do projeto (Padrão: diretório atual)")
    args = parser.parse_args()

    project_dir = Path(args.dir).resolve()
    print(f"🚀 Iniciando bundling do projeto em: {project_dir}\n")

    backend_files, frontend_files = find_files(project_dir)

    if not backend_files and not frontend_files:
        print("⚠️ Nenhum arquivo .js, .gs ou .html foi encontrado.")
        return

    output_backend = project_dir / "bundled_backend.gs"
    output_frontend = project_dir / "bundled_frontend.html"

    if backend_files:
        bundle_backend(backend_files, output_backend)

    if frontend_files:
        bundle_frontend(frontend_files, output_frontend, project_dir)

    print("\n🎉 Processo concluído com sucesso!")
    print("Agora você só precisa criar 2 arquivos no editor do Apps Script:")
    print(" 1. Um arquivo de código (.gs) e colar o conteúdo de 'bundled_backend.gs'")
    print(" 2. Um arquivo HTML (.html) e colar o conteúdo de 'bundled_frontend.html'")

if __name__ == "__main__":
    main()