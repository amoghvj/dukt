/**
 * Dukt - Test Frontend JavaScript
 * Simple API calls and JSON display, no business logic
 */

const API_BASE = '';

// DOM Elements
const responseBody = document.getElementById('responseBody');
const responseStatus = document.getElementById('responseStatus');
const responseTime = document.getElementById('responseTime');
const responseSize = document.getElementById('responseSize');
const statusIndicator = document.getElementById('statusIndicator');
const pageTitle = document.getElementById('pageTitle');
const endpointBadge = document.getElementById('endpointBadge');
const copyBtn = document.getElementById('copyBtn');
const seedMockBtn = document.getElementById('seedMockBtn');
const detailPanel = document.getElementById('detailPanel');
const detailBody = document.getElementById('detailBody');

// Navigation items
const navItems = document.querySelectorAll('.nav-item');

// Current response data
let currentResponse = null;

// Executions View mode: 'table' or 'nested'
let executionsViewMode = 'table';

/**
 * Fetch an endpoint and display the response
 */
async function fetchEndpoint(endpoint) {
    setLoading(true);
    const startTime = Date.now();

    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const endTime = Date.now();
        const data = await response.json();

        currentResponse = data;

        // Update status
        responseStatus.textContent = response.status;
        responseStatus.className = 'info-value ' + (response.ok ? 'success' : 'error');
        responseTime.textContent = `${endTime - startTime}ms`;

        // Calculate size
        const jsonStr = JSON.stringify(data, null, 2);
        responseSize.textContent = `${(jsonStr.length / 1024).toFixed(2)} KB`;

        // Handle Executions View specially
        if (endpoint === '/api/executions') {
            renderExecutionsView(data.data);
        } else if (endpoint === '/architecture') {
            hideExecToggle();
            renderArchitectureView();
        } else {
            // Default raw JSON view for other endpoints
            hideExecToggle();
            responseBody.innerHTML = syntaxHighlight(jsonStr);
        }

        setLoading(false, response.ok);

        // Hide detail panel (legacy single-view)
        detailPanel.style.display = 'none';

    } catch (error) {
        currentResponse = { error: error.message };
        responseBody.textContent = `Error: ${error.message}`;
        responseStatus.textContent = 'Error';
        responseStatus.className = 'info-value error';
        responseTime.textContent = '-';
        responseSize.textContent = '-';
        setLoading(false, false);
    }
}

/**
 * Render Executions View (Table or Nested Blocks)
 */
/**
 * Render Executions View (Table or Nested Blocks)
 */
function renderExecutionsView(executions) {
    if (!executions || executions.length === 0) {
        responseBody.innerHTML = '<div class="info-value">No executions found</div>';
        return;
    }

    // Move Toggle to Header (ensure it exists only once)
    let toggleContainer = document.getElementById('execViewToggleContainer');
    if (!toggleContainer) {
        const header = document.querySelector('.response-header');
        if (header) {
            toggleContainer = document.createElement('div');
            toggleContainer.id = 'execViewToggleContainer';
            toggleContainer.style.marginRight = '8px'; // Spacing from copy button
            header.insertBefore(toggleContainer, header.lastElementChild); // Insert before Copy button
        }
    }

    if (toggleContainer) {
        toggleContainer.innerHTML = `
            <button class="view-toggle-btn" id="execViewToggleBtn">
                View: ${executionsViewMode === 'nested' ? 'Nested Blocks' : 'Flat Table'}
            </button>
        `;

        // Attach Toggle Listener
        const btn = document.getElementById('execViewToggleBtn');
        if (btn) {
            btn.onclick = () => {
                executionsViewMode = executionsViewMode === 'nested' ? 'table' : 'nested';
                renderExecutionsView(executions);
            };
        }
        toggleContainer.style.display = 'block';
    }

    if (executionsViewMode === 'table') {
        // Render JSON Table
        responseBody.innerHTML = syntaxHighlight(JSON.stringify(executions, null, 2));
    } else {
        // Render Nested Blocks
        const blocksHtml = renderTopLevelBlocks(executions);
        // responseBody.innerHTML = `<div class="executions-container">${blocksHtml}</div>`;
        responseBody.innerHTML = `<div>${blocksHtml}</div>`;
    }
}

/**
 * Render Top-Level Transaction Blocks (Entry Point for Nested View)
 */
function renderTopLevelBlocks(executions) {
    // Nest blocks by maxDepth algorithm
    const nestedBlocks = nestBlocksByMaxDepth(executions);

    // Render all top-level blocks
    return nestedBlocks.map(block => renderBlock(block)).join('');
}

/**
 * Nest Blocks by maxDepth Algorithm
 * - Check dictionary for block with maxDepth - 1
 * - If found, add as child; else add to top level
 * - Store current block at its maxDepth in dictionary
 */
function nestBlocksByMaxDepth(blocks) {
    if (!blocks || blocks.length === 0) return [];

    const topLevel = [];
    const depthMap = {}; // maxDepth -> last block at that depth

    blocks.forEach(block => {
        // Ensure children array exists
        block.children = block.children || [];

        const parentDepth = block.maxDepth - 1;

        if (parentDepth >= 0 && depthMap[parentDepth]) {
            // Found parent - add as child
            depthMap[parentDepth].children.push(block);
        } else {
            // No parent found - add to top level
            topLevel.push(block);
        }

        // Store this block at its depth (replace previous)
        depthMap[block.maxDepth] = block;
    });

    return topLevel;
}

/**
 * Render a Single Block (Recursive)
 * Structure: Title | Body | Children
 */
function renderBlock(block, isNested = false) {
    const blockId = block.txHash || `block-${Math.random().toString(36).substr(2, 9)}`;
    const isRevert = block.status === 'revert';
    const statusIcon = isRevert ? '❌' : '✅';
    const statusClass = isRevert ? 'revert' : 'success';

    // Title: entryFunction + status + stepCount
    const title = `${block.entryFunction || 'unknown'}()`;

    // Body content (all properties)
    const bodyContent = {
        txHash: block.txHash,
        projectId: block.projectId,
        status: block.status,
        entryFunction: block.entryFunction,
        stepCount: block.stepCount,
        maxDepth: block.maxDepth
    };
    const bodyHtml = syntaxHighlight(JSON.stringify(bodyContent, null, 2));

    // Children summary
    const childrenNames = (block.children || []).map(c => c.entryFunction || 'unknown');
    const childrenSummary = childrenNames.length > 0
        ? `[${childrenNames.map(n => `'${n}'`).join(', ')}]`
        : '[]';

    // Render children blocks recursively
    const childrenHtml = (block.children || []).map(child => renderBlock(child, true)).join('');

    return `
    <div class="tx-block ${isNested ? 'nested' : ''}" data-id="${blockId}">
        <div class="tx-block-title" onclick="toggleBlockBody('${blockId}')">
            <span class="tx-status ${statusClass}">${statusIcon}</span>
            <span class="tx-func">${title}</span>
            <span class="tx-meta">${block.status} • ${block.stepCount} steps</span>
        </div>
        
        <div class="tx-block-body hidden" id="body-${blockId}">
            <pre class="tx-body-json">${bodyHtml}</pre>
        </div>
        
        ${block.children && block.children.length > 0 ? `
        <div class="tx-block-children-header" onclick="toggleBlockChildren('${blockId}')">
            <span class="toggle-arrow" id="arrow-${blockId}">▶</span>
            <span class="children-label">Children: ${childrenSummary}</span>
        </div>
        <div class="tx-block-children hidden" id="children-${blockId}">
            ${childrenHtml}
        </div>
        ` : ''}
    </div>
    `;
}

/**
 * Toggle Block Body visibility
 */
function toggleBlockBody(blockId) {
    const body = document.getElementById(`body-${blockId}`);
    if (body) {
        body.classList.toggle('hidden');
    }
}

/**
 * Toggle Block Children visibility
 */
function toggleBlockChildren(blockId) {
    const children = document.getElementById(`children-${blockId}`);
    const arrow = document.getElementById(`arrow-${blockId}`);
    if (children) {
        children.classList.toggle('hidden');
    }
    if (arrow) {
        arrow.classList.toggle('expanded');
    }
}


/**
 * Make hashes clickable in Table Mode (Legacy)
 * Just opens the block view but in the legacy Detail Panel? 
 * User said "no two separate parts", so maybe we just auto-switch to nested view or ignore this?
 * "link functionality of hash is removed" - OK, so in table view, it's just raw JSON text.
 */
function makeHashesClickable() {
    // User requested logic removal. Just keeping for raw text display.
}

/**
 * Set loading state
 */
function setLoading(loading, success = null) {
    if (loading) {
        statusIndicator.textContent = 'Loading...';
        statusIndicator.className = 'status-indicator loading';
    } else if (success === true) {
        statusIndicator.textContent = 'Success';
        statusIndicator.className = 'status-indicator success';
    } else if (success === false) {
        statusIndicator.textContent = 'Error';
        statusIndicator.className = 'status-indicator error';
    } else {
        statusIndicator.textContent = 'Ready';
        statusIndicator.className = 'status-indicator';
    }
}

/**
 * Basic JSON syntax highlighting
 */
function syntaxHighlight(json) {
    return json.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                    match = match.replace(/:$/, '');
                    return `<span class="${cls}">${match}</span>:`;
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

/**
 * Copy response to clipboard
 */
function copyToClipboard() {
    if (currentResponse) {
        navigator.clipboard.writeText(JSON.stringify(currentResponse, null, 2));
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 1500);
    }
}

// Event Listeners and Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] Initializing...');

    // Re-query to be safe
    const navItems = document.querySelectorAll('.nav-item');
    const seedMockBtn = document.getElementById('seedMockBtn');
    const copyBtn = document.getElementById('copyBtn');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            console.log(`[App] Navigating to ${item.dataset.endpoint}`);

            // Update active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update header
            const endpoint = item.dataset.endpoint;
            if (pageTitle) pageTitle.textContent = (typeof endpointTitles !== 'undefined' ? endpointTitles[endpoint] : null) || endpoint;
            if (endpointBadge) endpointBadge.textContent = `GET ${endpoint}`;

            // Fetch data
            fetchEndpoint(endpoint);
        });
    });

    if (seedMockBtn) {
        seedMockBtn.addEventListener('click', () => {
            pageTitle.textContent = 'Seed Mock Data';
            endpointBadge.textContent = 'POST /api/internal/seed-mock';
            seedMockData();
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }

    // Initial fetch
    fetchEndpoint('/health');
});

/**
 * Render Trace Tree UI
 */
function renderTraceTree(steps) {
    if (!steps || steps.length === 0) return '<div class="info-value">No steps recorded</div>';

    let html = '<div class="trace-container">';

    steps.forEach((step, index) => {
        const depth = step.depth || 0;
        const nextStep = steps[index + 1];
        const hasChildren = nextStep && (nextStep.depth || 0) > depth;
        const status = step.status || 'success';
        const isRevert = status === 'revert';

        // Indentation line logic
        let indentHtml = '';
        for (let i = 0; i < depth; i++) {
            indentHtml += '<div class="trace-line"></div>';
        }

        // Collapse button or placeholder
        const collapseHtml = hasChildren
            ? `<button class="collapse-btn" data-index="${index}">▼</button>`
            : `<span class="collapse-placeholder"></span>`;

        // Icon
        const icon = isRevert ? '❌' : '✅';
        const colorClass = isRevert ? 'revert' : 'success';

        html += `
        <div class="trace-row" data-depth="${depth}" data-index="${index}">
            <div class="trace-indent">
                ${indentHtml}
                ${collapseHtml}
            </div>
            <div class="trace-content">
                <span class="trace-status ${colorClass}">${icon}</span>
                <span class="trace-contract">${step.contractAddress ? 'Contract' : 'Unknown'}</span>
                <span class="trace-func">${step.functionName || 'fallback'}</span>
                ${step.gasUsed ? `<span class="trace-args">(${step.gasUsed} gas)</span>` : ''}
            </div>
        </div>
        `;
    });

    html += '</div>';
    return html;
}

// Add event listener for trace tree toggle (Legacy & New)
detailBody.addEventListener('click', (e) => {
    // Legacy Tree Toggles
    if (e.target.classList.contains('collapse-btn')) {
        const btn = e.target;
        const row = btn.closest('.trace-row');
        if (!row) return;

        const isCollapsed = btn.classList.toggle('collapsed');
        const parentDepth = parseInt(row.dataset.depth);

        let nextRow = row.nextElementSibling;

        while (nextRow) {
            const nextDepth = parseInt(nextRow.dataset.depth);
            if (nextDepth <= parentDepth) break; // End of branch

            // Toggle visibility logic
            if (isCollapsed) {
                nextRow.classList.add('hidden');
            } else {
                nextRow.classList.remove('hidden');
                // Simple expand: unhide all descendants (MVP simplicity)
            }

            nextRow = nextRow.nextElementSibling;
        }
    }

    // New JSON Block Toggles
    if (e.target.classList.contains('block-header') || e.target.closest('.block-header')) {
        // Toggle the JSON content body
        const header = e.target.classList.contains('block-header') ? e.target : e.target.closest('.block-header');
        const content = header.nextElementSibling; // .block-content
        if (content && content.classList.contains('block-content')) {
            content.classList.toggle('hidden');
        }
    }

    if (e.target.classList.contains('block-children-toggle') || e.target.closest('.block-children-toggle')) {
        // Toggle the nested children container
        const toggle = e.target.classList.contains('block-children-toggle') ? e.target : e.target.closest('.block-children-toggle');
        const container = toggle.nextElementSibling; // .block-children-container
        const arrow = toggle.querySelector('.toggle-arrow');

        if (container && container.classList.contains('block-children-container')) {
            container.classList.toggle('hidden');
            if (arrow) arrow.classList.toggle('expanded');
        }
    }
});

/**
 * Build recursive tree from flat steps with depth
 */
/**
 * Build recursive tree from flat steps with depth (Simplified Logic)
 * Logic: Iterate, add as child to last encountered item with depth = current.depth - 1
 */
function buildTree(steps) {
    if (!steps || steps.length === 0) return [];

    const root = [];
    const lastAtDepth = {}; // Map depth -> last node seen at that depth

    steps.forEach(step => {
        const node = { ...step, children: [] };

        if (step.depth === 0) {
            root.push(node);
        } else {
            // Find parent at depth - 1
            const parent = lastAtDepth[step.depth - 1];
            if (parent) {
                parent.children.push(node);
            } else {
                // If no strict parent found (broken tree), fallback to root or ignore
                // For robustness, treat as root if orphaned
                root.push(node);
            }
        }

        // Register self as last seen at this depth
        lastAtDepth[step.depth] = node;
    });

    return root;
}

/**
 * Render Recursive JSON Blocks
 */
function renderJsonBlocks(nodes, isNested = false) {
    if (!nodes || nodes.length === 0) return '';

    let html = '';

    nodes.forEach(node => {
        const isRevert = node.status === 'revert';
        const icon = isRevert ? '❌' : '✅';
        const statusClass = isRevert ? 'revert' : 'success';

        // Prepare JSON content - FULL content as requested
        const displayContent = { ...node };
        delete displayContent.children; // But hide children property itself from the JSON view to avoid recursion mess

        const jsonHtml = syntaxHighlight(JSON.stringify(displayContent, null, 2));

        // Children Array Summary in Toggle
        const childNames = node.children.map(c => c.functionName || 'unknown');
        const childrenSummary = node.children.length > 0
            ? `Children: [ ${childNames.map(n => `'${n}'`).join(', ')} ]`
            : 'No Children';

        // Render block
        html += `
        <div class="trace-block ${isNested ? 'nested' : ''}">
            <div class="block-header">
                <div class="block-title">
                    <span class="block-status-icon ${statusClass}">${icon}</span>
                    <span class="block-contract">${node.contractName || node.contractAddress || 'Unknown'}</span>
                    <span class="block-func">${node.functionName || 'fallback'}</span>
                </div>
                <div class="block-gas">${node.gasUsed ? node.gasUsed + ' gas' : ''}</div>
            </div>
            <div class="block-content"><div class="json-pre">${jsonHtml}</div></div>
            ${node.children.length > 0 ? `
            <div class="block-children-toggle">
                <span class="toggle-arrow">▶</span>
                <span class="children-array">${childrenSummary}</span>
            </div>
            <div class="block-children-container hidden">${renderJsonBlocks(node.children, true)}</div>
            ` : ''}
        </div>
        `;
    });

    return html;
}

/**
 * Hide Executions View Toggle (for non-executions views)
 */
function hideExecToggle() {
    const toggleContainer = document.getElementById('execViewToggleContainer');
    if (toggleContainer) {
        toggleContainer.style.display = 'none';
    }
}

/**
 * Render VaultFi Architecture Diagram
 * Shows static image from backend, with HTML fallback
 */
function renderArchitectureView() {
    const html = `
    <div style="padding: 20px; font-family: var(--font-mono); overflow-y: auto; text-align: center;">
        
        <h3 style="color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.1em;">VaultFi Protocol</h3>
        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 16px;">DeFi Yield Vault Architecture</p>

        <!-- Static Image (from Eraser) -->
        <div id="arch-image-container">
            <img 
                src="/images/vaultfi-architecture.png" 
                alt="VaultFi Architecture Diagram"
                style="max-width: 100%; max-height: 600px; border-radius: 8px; border: 1px solid var(--border-color);"
                onerror="document.getElementById('arch-image-container').style.display='none'; document.getElementById('arch-fallback').style.display='block';"
            />
        </div>

        <!-- HTML Fallback (if image not found) -->
        <div id="arch-fallback" style="display: none; text-align: left; padding: 20px;">
            <!-- User Layer -->
            <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                <div style="padding: 10px 20px; border: 2px solid #6366f1; border-radius: 8px; background: rgba(99, 102, 241, 0.1); color: var(--text-primary); font-weight: 600; font-size: 0.85rem;">
                    👤 User
                </div>
            </div>
            
            <div style="text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 8px;">↓ deposit / withdraw</div>

            <!-- VaultCore -->
            <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                <div style="padding: 12px 24px; border: 2px solid #22c55e; border-radius: 8px; background: rgba(34, 197, 94, 0.1); color: var(--text-primary); font-weight: 600; font-size: 0.9rem; min-width: 140px; text-align: center;">
                    🏦 VaultCore
                    <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 400; margin-top: 4px;">deposit() • withdraw() • rebalance()</div>
                </div>
            </div>

            <div style="text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 8px;">↓ allocate / harvest</div>

            <!-- StrategyManager -->
            <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                <div style="padding: 12px 24px; border: 2px solid #f59e0b; border-radius: 8px; background: rgba(245, 158, 11, 0.1); color: var(--text-primary); font-weight: 600; font-size: 0.9rem; min-width: 160px; text-align: center;">
                    📊 StrategyManager
                    <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 400; margin-top: 4px;">allocateFunds() • harvestYield()</div>
                </div>
            </div>

            <div style="text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 8px;">↓ deploy / claim</div>

            <!-- YieldStrategy -->
            <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                <div style="padding: 12px 24px; border: 2px solid #8b5cf6; border-radius: 8px; background: rgba(139, 92, 246, 0.1); color: var(--text-primary); font-weight: 600; font-size: 0.9rem; min-width: 140px; text-align: center;">
                    🌱 YieldStrategy
                    <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 400; margin-top: 4px;">deployCapital() • claimRewards()</div>
                </div>
            </div>

            <div style="text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 8px;">↓ supply / redeem</div>

            <!-- External Protocols Row -->
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px;">
                <div style="padding: 10px 16px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.8rem; text-align: center;">
                    🏛️ LendingPool
                </div>
                <div style="padding: 10px 16px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.8rem; text-align: center;">
                    📈 PriceOracle
                </div>
                <div style="padding: 10px 16px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.8rem; text-align: center;">
                    💰 USDC
                </div>
            </div>
        </div>

        <!-- Legend -->
        <div style="margin-top: 16px; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); text-align: left;">
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Transaction Flows</div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.7rem;">
                <span style="color: #22c55e;">● Deposit</span>
                <span style="color: #3b82f6;">● Withdraw</span>
                <span style="color: #f59e0b;">● Rebalance</span>
                <span style="color: #ef4444;">● Failed TX</span>
                <span style="color: #8b5cf6;">● Oracle Update</span>
            </div>
        </div>
    </div>
    `;

    responseBody.innerHTML = html;
    hideExecToggle();
}
