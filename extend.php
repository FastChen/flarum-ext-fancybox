<?php

/*
 * This file is part of fastchen/fancybox.
 *
 * Copyright (c) 2026 FastChen.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace FastChen\Fancybox;

use Flarum\Extend;

return [
    new Extend\Locales(__DIR__ . '/locale'),
    
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js'),
];
