const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');

let currentDir = os.homedir();
let showHidden = false;
let selectedIndex = 0;

// Функция для получения списка файлов
function getFiles(dirPath) {
    try {
        let items = fs.readdirSync(dirPath);
        
        // Фильтрация скрытых файлов
        if (!showHidden) {
            items = items.filter(item => !item.startsWith('.'));
        }
        
        const fileList = [];
        
        // Добавляем родительскую директорию
        if (dirPath !== '/') {
            fileList.push({
                name: '..',
                isDirectory: true,
                display: '📁 .. (родительская директория)'
            });
        }
        
        // Добавляем файлы и папки
        items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            try {
                const stats = fs.statSync(itemPath);
                if (stats.isDirectory()) {
                    fileList.push({
                        name: item,
                        isDirectory: true,
                        display: `📁 ${item}/`
                    });
                } else {
                    fileList.push({
                        name: item,
                        isDirectory: false,
                        display: `📄 ${item}`
                    });
                }
            } catch (err) {
                fileList.push({
                    name: item,
                    isDirectory: false,
                    display: `⚠️  ${item}`
                });
            }
        });
        
        return fileList;
    } catch (err) {
        return [{
            name: 'error',
            isDirectory: false,
            display: `❌ Ошибка: ${err.message}`
        }];
    }
}

// Функция для получения содержимого для предпросмотра
function getPreviewContent(selectedFile) {
    if (!selectedFile) return 'Выберите файл или папку для предпросмотра';
    
    if (selectedFile.name === '..') {
        return '📁 Родительская директория\nНажмите Enter для перехода назад';
    }
    
    if (selectedFile.isDirectory) {
        try {
            const items = fs.readdirSync(path.join(currentDir, selectedFile.name));
            let content = `📁 Директория: ${selectedFile.name}\n\n`;
            content += `Содержит: ${items.length} элементов\n\n`;
            
            // Показываем первые 20 элементов
            const previewItems = items.slice(0, 20);
            previewItems.forEach(item => {
                const itemPath = path.join(currentDir, selectedFile.name, item);
                try {
                    const stats = fs.statSync(itemPath);
                    if (stats.isDirectory()) {
                        content += `📁 ${item}\n`;
                    } else {
                        content += `📄 ${item}\n`;
                    }
                } catch {
                    content += `⚠️  ${item}\n`;
                }
            });
            
            if (items.length > 20) {
                content += `\n... и еще ${items.length - 20} элементов`;
            }
            
            return content;
        } catch (err) {
            return `❌ Ошибка доступа к директории:\n${err.message}`;
        }
    } else {
        // Для файлов показываем содержимое
        const filePath = path.join(currentDir, selectedFile.name);
        try {
            const stats = fs.statSync(filePath);
            let content = `📄 Файл: ${selectedFile.name}\n`;
            content += `Размер: ${stats.size} байт\n`;
            content += `Изменен: ${stats.mtime.toLocaleString()}\n\n`;
            
            // Для текстовых файлов показываем содержимое (первые 1000 символов)
            if (stats.size > 0 && stats.size < 1000000) { // Менее 1MB
                const fileContent = fs.readFileSync(filePath, 'utf8');
                content += fileContent.substring(0, 1000);
                if (fileContent.length > 1000) {
                    content += '\n\n... (файл обрезан для предпросмотра)';
                }
            } else if (stats.size >= 1000000) {
                content += '❌ Файл слишком большой для предпросмотра (>1MB)';
            } else {
                content += '(пустой файл)';
            }
            
            return content;
        } catch (err) {
            return `❌ Ошибка чтения файла:\n${err.message}`;
        }
    }
}

// Функция для отображения двух панелей
function displayPanels() {
    console.clear();
    
    const files = getFiles(currentDir);
    const selectedFile = files[selectedIndex];
    
    // Получаем содержимое для предпросмотра
    const previewContent = getPreviewContent(selectedFile);
    
    // Определяем ширину терминала
    const terminalWidth = process.stdout.columns || 80;
    const leftPanelWidth = Math.floor(terminalWidth * 0.4); // 40% для левой панели
    const rightPanelWidth = terminalWidth - leftPanelWidth - 1; // Минус 1 для разделителя
    
    // Заголовок
    const status = showHidden ? '👁️  показ скрытых' : '🙈 скрытые спрятаны';
    const header = `📂 ${currentDir} [${status}]`;
    console.log(chalk.blue.bold(header.padEnd(terminalWidth, ' ')));
    console.log(chalk.gray('─'.repeat(terminalWidth)));
    
    // Определяем максимальную высоту для отображения
    const maxHeight = (process.stdout.rows || 30) - 5;
    
    // Отображаем файлы в левой панели
    for (let i = 0; i < maxHeight; i++) {
        let leftLine = '';
        let rightLine = '';
        
        // Левая панель - список файлов
        if (i < files.length) {
            const file = files[i];
            let displayText = file.display;
            
            // Обрезаем текст, если он слишком длинный
            if (displayText.length > leftPanelWidth - 4) {
                displayText = displayText.substring(0, leftPanelWidth - 7) + '...';
            }
            
            if (i === selectedIndex) {
                    
            //        leftLine = `▶ ${displayText}`//.padEnd(leftPanelWidth,' ');
//`▶ ${displayText}`// chalk.bgBlue.white.bold(` ▶${displayText}`).padEnd(leftPanelWidth,' ');

               //console.log(leftLine.length) 
leftLine = chalk.cyan( `▶  ${displayText}`)

            leftLine = leftLine.padEnd(leftPanelWidth+10, ' '); 

            //leftLine = leftLine.substring(0,leftPanelWidth)
            } else {
                leftLine = `  ${displayText}`;
            
            leftLine = leftLine.padEnd(leftPanelWidth, ' ');    
            }
        } else {
            leftLine = ' '.padEnd(leftPanelWidth, ' ');
        }
        
        // Правая панель - предпросмотр
        const previewLines = previewContent.split('\n');
        if (i < previewLines.length) {
            let previewLine = previewLines[i] || '';
            // Обрезаем строку, если она слишком длинная
            if (previewLine.length > rightPanelWidth - 2) {
                previewLine = previewLine.substring(0, rightPanelWidth - 5) + '...';
            }
            rightLine = chalk.gray(previewLine);
        }
        
        // Выводим строку
        console.log(leftLine + '│'+ ' ' + rightLine);
    }
    
    // Нижняя строка с инструкциями
    console.log(chalk.gray('─'.repeat(terminalWidth)));
    console.log(chalk.gray('↑/↓ - навигация | Enter - открыть | H - скрытые файлы | Q - выход '));
}

// Функция для перехода в директорию
function changeDirectory(newPath) {
    try {
        const resolvedPath = path.resolve(currentDir, newPath);
        if (fs.statSync(resolvedPath).isDirectory()) {
            currentDir = resolvedPath;
            selectedIndex = 0;
            displayPanels();
        } else {
            console.log(chalk.red('\n❌ Это не директория'));
            setTimeout(displayPanels, 1000);
        }
    } catch (err) {
        console.log(chalk.red('\n❌ Директория не найдена'));
        setTimeout(displayPanels, 1000);
    }
}

// Основная функция запуска
function startFileManager() {
    console.log(chalk.blue.bold('\n📂 Файловый менеджер загружается...'));
    
    // Устанавливаем raw mode для захвата клавиш
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    
    // Показываем панели
    displayPanels();
    
    // Обрабатываем ввод
    process.stdin.on('data', (key) => {
        // Стрелка вверх
        if (key === '\u001b[A') {
            const files = getFiles(currentDir);
            if (files.length > 0 && selectedIndex > 0) {
                selectedIndex--;
                displayPanels();
            }
        }
        // Стрелка вниз
        else if (key === '\u001b[B') {
            const files = getFiles(currentDir);
            if (files.length > 0 && selectedIndex < files.length - 1) {
                selectedIndex++;
                displayPanels();
            }
        }
        // Enter
        else if (key === '\r') {
            const files = getFiles(currentDir);
            if (files[selectedIndex]) {
                const selectedFile = files[selectedIndex];
                if (selectedFile.name === '..') {
                    currentDir = path.dirname(currentDir);
                    selectedIndex = 0;
                    displayPanels();
                } else if (selectedFile.isDirectory) {
                    changeDirectory(selectedFile.name);
                } else {
                    // Для файлов просто обновляем предпросмотр
                    displayPanels();
                }
            }
        }
        // H - переключить скрытые файлы
        else if (key.toLowerCase() === 'h') {
            showHidden = !showHidden;
            selectedIndex = 0;
            displayPanels();
        }
        // Q или Ctrl+C - выход
        else if (key.toLowerCase() === 'q' || key === '\u0003') {
            console.log('\n' + chalk.blue('👋 До свидания!\n'));
            process.exit(0);
        }
    });
    
    // Обработка изменения размера терминала
    process.stdout.on('resize', () => {
        displayPanels();
    });
    
    // Обработка выхода
    process.on('exit', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
    });
}

// Запуск программы
startFileManager();
