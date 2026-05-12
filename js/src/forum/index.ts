import { extend } from 'flarum/extend';
import app from 'flarum/app';
import CommentPost from 'flarum/components/CommentPost';

/**
 * 动态加载 Fancybox CDN
 */
const loadFancyboxCDN = () => {
  return new Promise((resolve) => {
    // 加载 CSS
    if (!document.getElementById('fancybox-css')) {
      const link = document.createElement('link');
      link.id = 'fancybox-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.1/dist/fancybox/fancybox.css';
      document.head.appendChild(link);
    }

    if (window.Fancybox) {
      resolve(window.Fancybox);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.1/dist/fancybox/fancybox.umd.js';
    script.onload = () => resolve(window.Fancybox);
    script.onerror = () => console.error('Fancybox CDN 加载失败');
    document.body.appendChild(script);
  });
};

const applyFancyboxAttributes = (postEl, postId) => {
  const images = Array.from(postEl.querySelectorAll('img')).filter(img => {
    return !img.closest('a'); // 排除父级有链接的图片
  });

  images.forEach(img => {
    img.setAttribute('data-fancybox', `post-${postId}`);
    img.setAttribute('data-src', img.src);
    img.style.cursor = 'pointer';
  });
};


/**
 * 从帖子 DOM 元素可靠地获取帖子 ID
 */
const getPostIdFromElement = (el) => {
  // 优先从 data-id 获取（许多主题会保留）
  if (el.dataset.id) return el.dataset.id;
  // 其次尝试从 #post-xxx 的 ID 属性推导
  const postDiv = el.closest('[id^="post-"]');
  if (postDiv) return postDiv.id.replace('post-', '');
  // 最后回退随机值（建议打印警告以便发现未适配的主题）
  return Math.random().toString(36).substr(2, 9);
};


/**
 * 初始化扩展，加载 Fancybox 并全局绑定事件
 */
app.initializers.add('fastchen/fancybox', async () => {
  // 1. 保证 Fancybox 加载完成
  await loadFancyboxCDN();

  // 2. 全局委托绑定（只需要这一次！）
  Fancybox.bind('[data-fancybox]', {
    groupAttr: 'data-fancybox', // 根据这个属性值自动分相册
    Carousel: {
      Toolbar: {
        display: {
          left: ["counter"],
          middle: [
            "zoomIn", "zoomOut", "toggle1to1",
            "rotateCCW", "rotateCW", "flipX", "flipY", "reset"
          ],
          right: ["autoplay", "fullscreen", "thumbs", "close"],
        },
      },
    },
    Hash: false,
    Thumbs: false,
    dragToClose: true,
    Image: { zoom: true }
  });

  // 3. 对已经存在的帖子补充属性（如果渲染比脚本加载早）
  document.querySelectorAll('.Post').forEach(post => {
    const postId = getPostIdFromElement(post);
    applyFancyboxAttributes(post, postId);
  });

  // 4. 未来再创建的新帖子，通过生命周期自动补属性
  extend(CommentPost.prototype, 'oncreate', function () {
    const postId = this.attrs.post.data.id;  // v1 用 .data.id
    applyFancyboxAttributes(this.element, postId);
  });

  extend(CommentPost.prototype, 'onupdate', function () {
    const postId = this.attrs.post.data.id;
    applyFancyboxAttributes(this.element, postId);
  });

  // 5. 动态新增帖子（例如滚动加载）继续补属性
  // MutationObserver
  const postList = document.querySelector('.Posts');
  if (postList) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.matches?.('.Post')) {
            const postId = getPostIdFromElement(node); // 用降级方法
            applyFancyboxAttributes(node, postId);
          }
        });
      });
    });
    observer.observe(postList, { childList: true, subtree: true });
  }
});