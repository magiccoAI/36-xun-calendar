export class ProgressRenderer {
    static generateProgressHTML(progressDays, checkedCount, totalCount) {
        try {
            if (!Array.isArray(progressDays)) {
                throw new Error('Progress days must be an array');
            }

            let progressHtml = '<div class="progress-tracker flex items-center justify-center h-full space-x-[2px] overflow-x-auto pb-2" role="group" aria-label="每日打卡进度">';
            
            progressDays.forEach(day => {
                const bgClass = day.isChecked ? '' : 'bg-white';
                const borderClass = day.isChecked ? '' : 'border-gray-300';
                const opacityClass = day.isFuture ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer hover:scale-110 transition-all duration-200';
                let additionalClass = '';
                
                let style = day.isChecked 
                    ? `background-color: ${day.xunColor}; border-color: ${day.xunColor};` 
                    : `border-color: #d1d5db;`;
                
                if (day.isToday) {
                    borderClass = 'border-2 border-blue-500 z-10';
                    additionalClass = 'ring-2 ring-blue-200 shadow-md animate-pulse';
                    style = day.isChecked 
                        ? `background-color: ${day.xunColor}; border-color: #3b82f6;` 
                        : `border-color: #3b82f6;`;
                }
                
                const actionAttr = day.canToggle ? `data-action="toggle-checkin" data-date="${day.dateStr}" data-index="${day.dateStr}"` : '';
                const tabindex = day.canToggle ? '0' : '-1';
                const ariaLabel = day.tooltip;
                const ariaPressed = day.isChecked ? 'true' : 'false';
                
                progressHtml += `<div class="progress-day flex items-center justify-center shrink-0 md:w-auto md:h-auto md:block" ${actionAttr}>
                    <button 
                        class="w-5 h-5 md:w-2.5 md:h-2.5 rounded-[1px] border ${bgClass} ${borderClass} ${opacityClass} ${additionalClass} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1" 
                        style="${style}" 
                        title="${ariaLabel}"
                        aria-label="${ariaLabel}"
                        aria-pressed="${ariaPressed}"
                        tabindex="${tabindex}"
                        ${day.canToggle ? '' : 'disabled'}
                    ></button>
                </div>`;
            });
            
            progressHtml += `<span class="ml-2 text-[10px] text-gray-400 font-mono self-center hidden md:inline-block" aria-label="进度统计">${checkedCount}/${totalCount}</span>`;
            progressHtml += '</div>';
            
            return progressHtml;
        } catch (error) {
            console.error('ProgressRenderer.generateProgressHTML error:', error);
            return '<div class="text-red-500 text-sm">进度显示错误</div>';
        }
    }

    static generateMobileProgressHTML(progressDays, checkedCount, totalCount) {
        try {
            if (!Array.isArray(progressDays)) {
                throw new Error('Progress days must be an array');
            }

            let progressHtml = '<div class="mobile-progress-tracker flex items-center space-x-2 overflow-x-auto py-3 px-2" role="group" aria-label="每日打卡进度">';
            
            progressDays.forEach(day => {
                const bgClass = day.isChecked ? '' : 'bg-white';
                const borderClass = day.isChecked ? '' : 'border-gray-300';
                const opacityClass = day.isFuture ? 'opacity-40' : 'opacity-100';
                let additionalClass = '';
                
                let style = day.isChecked 
                    ? `background-color: ${day.xunColor}; border-color: ${day.xunColor};` 
                    : `border-color: #d1d5db;`;
                
                if (day.isToday) {
                    borderClass = 'border-2 border-blue-500';
                    additionalClass = 'ring-2 ring-blue-200 shadow-lg';
                    style = day.isChecked 
                        ? `background-color: ${day.xunColor}; border-color: #3b82f6;` 
                        : `border-color: #3b82f6;`;
                }
                
                const actionAttr = day.canToggle ? `data-action="toggle-checkin" data-date="${day.dateStr}" data-index="${day.dateStr}"` : '';
                const ariaLabel = day.tooltip;
                const ariaPressed = day.isChecked ? 'true' : 'false';
                const dayNumber = new Date(day.dateStr).getDate();
                
                progressHtml += `<div class="mobile-progress-day flex-shrink-0" ${actionAttr}>
                    <button 
                        class="w-10 h-10 rounded-xl border ${bgClass} ${borderClass} ${opacityClass} ${additionalClass} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 flex items-center justify-center" 
                        style="${style}" 
                        title="${ariaLabel}"
                        aria-label="${ariaLabel}"
                        aria-pressed="${ariaPressed}"
                        ${day.canToggle ? '' : 'disabled'}
                    >
                        <span class="text-sm font-bold ${day.isChecked ? 'text-white' : 'text-gray-600'}">
                            ${dayNumber}
                        </span>
                        ${day.isChecked ? '<span class="absolute inset-0 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></span>' : ''}
                    </button>
                </div>`;
            });
            
            progressHtml += `<div class="ml-3 flex flex-col flex-shrink-0">
                <span class="text-xs text-gray-400 font-mono" aria-label="进度统计">${checkedCount}/${totalCount}</span>
                <span class="text-xs text-gray-400" aria-label="完成率">${Math.round((checkedCount/totalCount) * 100)}%</span>
            </div>`;
            progressHtml += '</div>';
            
            return progressHtml;
        } catch (error) {
            console.error('ProgressRenderer.generateMobileProgressHTML error:', error);
            return '<div class="text-red-500 text-sm p-2">进度显示错误</div>';
        }
    }
}
