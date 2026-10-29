const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

const ROLE_POLICIES = {
    ADMIN: {
        canView: () => true,
        isPriority: (item) => item.value > ADMIN_PRIORITY_THRESHOLD,
    },
    USER: {
        canView: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
        isPriority: () => false,
    },
};

const NO_ACCESS_POLICY = {
    canView: () => false,
    isPriority: () => false,
};

class CsvFormatter {
    header() {
        return 'ID,NOME,VALOR,USUARIO\n';
    }

    row(item, user) {
        return `${item.id},${item.name},${item.value},${user.name}\n`;
    }

    footer(total) {
        return `\nTotal,,\n${total},,\n`;
    }
}

class HtmlFormatter {
    header(user) {
        return [
            '<html><body>',
            '<h1>Relatório</h1>',
            `<h2>Usuário: ${user.name}</h2>`,
            '<table>',
            '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
            '',
        ].join('\n');
    }

    row(item, _user, isPriority) {
        const style = isPriority ? ' style="font-weight:bold;"' : '';
        return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    }

    footer(total) {
        return ['</table>', `<h3>Total: ${total}</h3>`, '</body></html>', ''].join('\n');
    }
}

const FORMATTERS = {
    CSV: new CsvFormatter(),
    HTML: new HtmlFormatter(),
};

export class ReportGenerator {
    constructor(database) {
        this.db = database;
    }

    generateReport(reportType, user, items) {
        const formatter = FORMATTERS[reportType];
        if (!formatter) {
            return '';
        }

        const policy = ROLE_POLICIES[user.role] ?? NO_ACCESS_POLICY;
        const visibleItems = items.filter(policy.canView);

        const header = formatter.header(user);
        const body = visibleItems
            .map((item) => formatter.row(item, user, policy.isPriority(item)))
            .join('');
        const footer = formatter.footer(this.#sumValues(visibleItems));

        return `${header}${body}${footer}`.trim();
    }

    #sumValues(items) {
        return items.reduce((total, item) => total + item.value, 0);
    }
}